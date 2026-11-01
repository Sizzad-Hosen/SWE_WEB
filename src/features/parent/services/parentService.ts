import { parentSupabase } from "../../../config/parentSupabase";

let realtimeChannelSequence = 0;

function nextRealtimeChannelName(prefix: string) {
  realtimeChannelSequence += 1;
  return `${prefix}-${Date.now()}-${realtimeChannelSequence}`;
}

export type SubjectProgress = {
  subjectId: string;
  titleBn: string;
  titleEn: string;
  completedChapters: number;
  totalChapters: number;
  percentage: number;
};

export type ParentChild = {
  id: string;
  studentCode: string;
  displayName: string;
  classLevel: number;
  avatarKey: string;
  totalPoints: number;
  totalProgress: number;
  totalStars: number;
  subjectProgress: SubjectProgress[];
};

export type ParentLinkRequest = {
  id: string;
  studentId: string;
  requestedName: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | "expired";
  expiresAt: string;
  createdAt: string;
};

type StudentRow = {
  id: string;
  student_code: string;
  display_name: string;
  class_level: number;
  avatar_key: string;
  total_points: number;
};

type StudentReportRow = {
  student_id: string;
  display_name: string;
  class_level: number;
  total_progress: number | string;
  total_points: number;
  total_stars: number | string;
  subject_progress: Array<{
    subject_id: string;
    title_bn: string;
    title_en: string;
    completed_chapters: number;
    total_chapters: number;
    percentage: number | string;
  }>;
};

function throwSupabaseError(
  error: { message: string } | null,
) {
  if (error) {
    throw new Error(error.message);
  }
}

async function getParentUserId() {
  const { data, error } =
    await parentSupabase.auth.getSession();

  throwSupabaseError(error);

  const userId = data.session?.user.id;

  if (!userId) {
    throw new Error(
      "Parent login is required.",
    );
  }

  return userId;
}

function mapReport(
  student: StudentRow,
  report: StudentReportRow,
): ParentChild {
  return {
    id: student.id,
    studentCode: student.student_code,
    displayName: student.display_name,
    classLevel: student.class_level,
    avatarKey: student.avatar_key,
    totalPoints: Number(
      report.total_points ??
        student.total_points,
    ),
    totalProgress: Number(
      report.total_progress ?? 0,
    ),
    totalStars: Number(
      report.total_stars ?? 0,
    ),
    subjectProgress: (
      report.subject_progress ?? []
    ).map((subject) => ({
      subjectId: subject.subject_id,
      titleBn: subject.title_bn,
      titleEn: subject.title_en,
      completedChapters: Number(
        subject.completed_chapters,
      ),
      totalChapters: Number(
        subject.total_chapters,
      ),
      percentage: Number(
        subject.percentage,
      ),
    })),
  };
}

export const parentService = {
  async requestLink(
    studentCode: string,
    childName: string,
  ) {
    const normalizedName = childName
      .trim()
      .replace(/\s+/g, " ");

    if (
      normalizedName.length < 1 ||
      normalizedName.length > 40
    ) {
      throw new Error(
        "Child name must contain 1 to 40 characters.",
      );
    }

    const { data, error } =
      await parentSupabase.rpc(
        "request_parent_link_with_name",
        {
          p_student_code: studentCode
            .trim()
            .toUpperCase(),
          p_display_name:
            normalizedName,
        },
      );

    throwSupabaseError(error);

    if (!data) {
      throw new Error(
        "Link request could not be created.",
      );
    }

    return data as string;
  },

  async getChildren() {
    const parentUserId =
      await getParentUserId();

    const {
      data: accessRows,
      error: accessError,
    } = await parentSupabase
      .from("student_access")
      .select("student_id")
      .eq("user_id", parentUserId)
      .eq("access_type", "parent");

    throwSupabaseError(accessError);

    const studentIds = (
      accessRows ?? []
    ).map(
      (row) => row.student_id as string,
    );

    if (studentIds.length === 0) {
      return [] as ParentChild[];
    }

    const {
      data: studentRows,
      error: studentError,
    } = await parentSupabase
      .from("students")
      .select(
        [
          "id",
          "student_code",
          "display_name",
          "class_level",
          "avatar_key",
          "total_points",
        ].join(", "),
      )
      .in("id", studentIds)
      .order("created_at", {
        ascending: true,
      });

    throwSupabaseError(studentError);

    const children = await Promise.all(
      (
        (studentRows ?? []) as unknown as StudentRow[]
      ).map(async (student) => {
        const { data, error } =
          await parentSupabase
            .rpc("get_student_report", {
              p_student_id: student.id,
            })
            .single();

        throwSupabaseError(error);

        return mapReport(
          student,
          data as unknown as StudentReportRow,
        );
      }),
    );

    return children;
  },

  async recoverLinkedChild(
    studentId: string,
    newChildUserId: string,
  ) {
    await getParentUserId();

    if (!studentId || !newChildUserId) {
      throw new Error(
        "Child recovery information is incomplete.",
      );
    }

    const { data, error } =
      await parentSupabase.rpc(
        "recover_linked_child",
        {
          p_student_id: studentId,
          p_new_child_user_id:
            newChildUserId,
        },
      );

    throwSupabaseError(error);

    if (
      !data ||
      typeof data !== "string" ||
      data !== studentId
    ) {
      throw new Error(
        "Linked child recovery could not be completed.",
      );
    }

    return data;
  },

  async getLinkRequests() {
    const parentUserId =
      await getParentUserId();

    const { data, error } =
      await parentSupabase
        .from("parent_link_requests")
        .select(
          [
            "id",
            "student_id",
            "requested_display_name",
            "status",
            "expires_at",
            "created_at",
          ].join(", "),
        )
        .eq(
          "parent_user_id",
          parentUserId,
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(10);

    throwSupabaseError(error);

    const requestRows =
      (data ?? []) as unknown as Array<{
        id: string;
        student_id: string;
        requested_display_name: string | null;
        status: ParentLinkRequest["status"];
        expires_at: string;
        created_at: string;
      }>;

    return requestRows.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      requestedName:
        row.requested_display_name ??
        "Child",
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));
  },

  async subscribeToLinkChanges(
    onChange: () => void,
  ) {
    const parentUserId =
      await getParentUserId();

    const channel = parentSupabase
      .channel(
        nextRealtimeChannelName(
          `parent-link-dashboard-${parentUserId}`,
        ),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_link_requests",
          filter:
            `parent_user_id=eq.${parentUserId}`,
        },
        onChange,
      )
      .subscribe();

    return () => {
      void parentSupabase.removeChannel(
        channel,
      );
    };
  },
};