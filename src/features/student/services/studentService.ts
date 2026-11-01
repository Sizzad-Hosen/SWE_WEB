import {
  isSupabaseConfigured,
  supabase,
} from "../../../config/supabase";

let realtimeChannelSequence = 0;

function nextRealtimeChannelName(prefix: string) {
  realtimeChannelSequence += 1;
  return `${prefix}-${Date.now()}-${realtimeChannelSequence}`;
}

export type StudentRow = {
  id: string;
  student_code: string;
  display_name: string;
  class_level: number;
  avatar_key: string;
  total_points: number;
  recovery_code: string | null;
};

export type PendingParentLinkRequest = {
  id: string;
  createdAt: string;
  expiresAt: string;
};

export type RecoveryCompletedChapter = {
  starsEarned: number;
  quizScore: number;
  completedAt: string;
};

export type RecoveryProgressSnapshot = {
  stars: number;
  weeklyStars: number;
  streak: number;
  badges: string[];
  unlockedChapterIds: string[];
  watchedVideoIds: string[];
  completedChapters: Record<
    string,
    RecoveryCompletedChapter
  >;
  lastSyncAt: string;
};

type ChapterProgressRow = {
  chapter_id: string;
  completed: boolean;
  stars: number;
  best_score: number;
  completed_at: string | null;
  updated_at: string;
};

type RecoveryChapterRow = {
  id: string;
  subject_id: string;
  chapter_number: number;
  title_bn: string;
};

function throwSupabaseError(
  error: { message: string } | null,
) {
  if (error) {
    throw new Error(error.message);
  }
}

function normalizeCredential(value: string) {
  return value.trim().toUpperCase();
}

export const studentService = {
  async ensureSession() {
    if (!isSupabaseConfigured) {
      throw new Error("Cloud sync is not configured.");
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    throwSupabaseError(sessionError);

    if (sessionData.session?.user) {
      return sessionData.session.user;
    }

    const { data, error } =
      await supabase.auth.signInAnonymously();

    throwSupabaseError(error);

    if (!data.user) {
      throw new Error(
        "Anonymous student account could not be created.",
      );
    }

    return data.user;
  },

  async createStudent(
    classLevel: number,
    nickname = "তুমি",
  ) {
    await this.ensureSession();

    const { data, error } = await supabase
      .rpc("create_student_profile", {
        p_display_name: nickname,
        p_class_level: classLevel,
        p_avatar_key: "tiger-1",
      })
      .single();

    throwSupabaseError(error);

    if (!data) {
      throw new Error(
        "Student profile could not be created.",
      );
    }

    return data as StudentRow;
  },

  async restoreStudent(
    studentCode: string,
    recoveryCode: string,
  ) {
    await this.ensureSession();

    const normalizedStudentCode =
      normalizeCredential(studentCode);
    const normalizedRecoveryCode =
      normalizeCredential(recoveryCode);

    if (
      !normalizedStudentCode ||
      !normalizedRecoveryCode
    ) {
      throw new Error(
        "Student ID and recovery code are required.",
      );
    }

    const { data, error } = await supabase.rpc(
      "restore_student_by_recovery_code",
      {
        p_student_code: normalizedStudentCode,
        p_recovery_code: normalizedRecoveryCode,
      },
    );

    throwSupabaseError(error);

    if (!data || typeof data !== "string") {
      throw new Error("Student account was not found.");
    }

    const row = await this.getStudent(data);

    if (!row) {
      throw new Error(
        "Student profile could not be loaded after recovery.",
      );
    }

    return row;
  },

  async getStudent(studentId: string) {
    const { data, error } = await supabase
      .from("students")
      .select(
        [
          "id",
          "student_code",
          "display_name",
          "class_level",
          "avatar_key",
          "total_points",
          "recovery_code",
        ].join(", "),
      )
      .eq("id", studentId)
      .maybeSingle();

    throwSupabaseError(error);

    return (data as StudentRow | null) ?? null;
  },

  async getRecoveryProgress(
    studentId: string,
    classLevel: number,
  ): Promise<RecoveryProgressSnapshot> {
    const [progressResult, chapterResult] =
      await Promise.all([
        supabase
          .from("chapter_progress")
          .select(
            [
              "chapter_id",
              "completed",
              "stars",
              "best_score",
              "completed_at",
              "updated_at",
            ].join(", "),
          )
          .eq("student_id", studentId),
        supabase
          .from("chapters")
          .select(
            "id, subject_id, chapter_number, title_bn",
          )
          .eq("class_level", classLevel)
          .eq("status", "published")
          .order("subject_id", { ascending: true })
          .order("chapter_number", {
            ascending: true,
          }),
      ]);

    throwSupabaseError(progressResult.error);
    throwSupabaseError(chapterResult.error);

    const progressRows =
    (progressResult.data ?? []) as unknown as ChapterProgressRow[];

    const chapterRows =
    (chapterResult.data ?? []) as unknown as RecoveryChapterRow[];

    const completedRows = progressRows.filter(
      (row) => row.completed,
    );

    const completedChapters: Record<
      string,
      RecoveryCompletedChapter
    > = {};

    let totalStars = 0;
    let weeklyStars = 0;

    const sevenDaysAgo =
      Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const row of completedRows) {
      const completedAt =
        row.completed_at ?? row.updated_at;
      const stars = Math.max(
        0,
        Number(row.stars) || 0,
      );

      totalStars += stars;

      if (
        Number.isFinite(Date.parse(completedAt)) &&
        Date.parse(completedAt) >= sevenDaysAgo
      ) {
        weeklyStars += stars;
      }

      completedChapters[row.chapter_id] = {
        starsEarned: stars,
        quizScore: Math.max(
          0,
          Number(row.best_score) || 0,
        ),
        completedAt,
      };
    }

    const completedIds = new Set(
      Object.keys(completedChapters),
    );
    const unlockedIds = new Set<string>();

    const chaptersBySubject = new Map<
      string,
      RecoveryChapterRow[]
    >();

    for (const chapter of chapterRows) {
      const current =
        chaptersBySubject.get(chapter.subject_id) ?? [];

      current.push(chapter);
      chaptersBySubject.set(
        chapter.subject_id,
        current,
      );
    }

    for (const chapters of chaptersBySubject.values()) {
      const ordered = [...chapters].sort(
        (a, b) =>
          a.chapter_number - b.chapter_number,
      );

      ordered.forEach((chapter, index) => {
        if (!completedIds.has(chapter.id)) {
          return;
        }

        unlockedIds.add(chapter.id);

        const nextChapter = ordered[index + 1];

        if (nextChapter) {
          unlockedIds.add(nextChapter.id);
        }
      });
    }

    const badges: string[] = [];

    if (completedRows.length > 0) {
      badges.push("first_chapter");
    }

    if (totalStars >= 100) {
      badges.push("star_collector_100");
    }

    const completedIdentityChapter =
      chapterRows.some(
        (chapter) =>
          completedIds.has(chapter.id) &&
          chapter.title_bn.trim() === "আমার পরিচয়",
      );

    if (completedIdentityChapter) {
      badges.push("identity_expert");
    }

    return {
      stars: totalStars,
      weeklyStars,
      streak: 0,
      badges,
      unlockedChapterIds: [...unlockedIds],
      watchedVideoIds: [],
      completedChapters,
      lastSyncAt: new Date().toISOString(),
    };
  },

  async findChildDeviceStudent(userId: string) {
    const { data: access, error: accessError } =
      await supabase
        .from("student_access")
        .select("student_id")
        .eq("user_id", userId)
        .eq("access_type", "child_device")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    throwSupabaseError(accessError);

    if (!access?.student_id) {
      return null;
    }

    return this.getStudent(
      access.student_id as string,
    );
  },

  async hasParentLink(studentId: string) {
    if (
      !isSupabaseConfigured ||
      studentId.startsWith("local-")
    ) {
      return false;
    }

    const { data, error } = await supabase
      .from("student_access")
      .select("user_id")
      .eq("student_id", studentId)
      .eq("access_type", "parent")
      .limit(1)
      .maybeSingle();

    throwSupabaseError(error);

    return Boolean(data);
  },

  async getPendingParentLinkRequest(
    studentId: string,
  ) {
    if (
      !isSupabaseConfigured ||
      studentId.startsWith("local-")
    ) {
      return null;
    }

    const { data, error } = await supabase
      .from("parent_link_requests")
      .select("id, created_at, expires_at")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    throwSupabaseError(error);

    if (!data) {
      return null;
    }

    return {
      id: data.id as string,
      createdAt: data.created_at as string,
      expiresAt: data.expires_at as string,
    } satisfies PendingParentLinkRequest;
  },

  async respondToParentLink(
    requestId: string,
    accept: boolean,
  ) {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Cloud sync is not configured.",
      );
    }

    const { data, error } = await supabase.rpc(
      "respond_parent_link",
      {
        p_request_id: requestId,
        p_accept: accept,
      },
    );

    throwSupabaseError(error);

    return data;
  },

  subscribeToParentLinkRequests(
    studentId: string,
    onChange: () => void,
  ) {
    if (
      !isSupabaseConfigured ||
      studentId.startsWith("local-")
    ) {
      return () => undefined;
    }

    const channel = supabase
      .channel(
        nextRealtimeChannelName(
          `child-parent-link-${studentId}`,
        ),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_link_requests",
          filter: `student_id=eq.${studentId}`,
        },
        onChange,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};