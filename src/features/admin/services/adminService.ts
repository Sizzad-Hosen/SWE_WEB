import { adminSupabase } from "../../../config/adminSupabase";
import { isSupabaseConfigured } from "../../../config/env";

import type {
  PublicationStatus,
  SupabaseActivityType,
} from "../../learning/types/supabaseCurriculum";

export type AdminRole = "admin" | "content_creator";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export type AdminChapter = {
  id: string;
  class_level: number;
  subject_id: string;
  chapter_number: number;
  title_bn: string;
  title_en: string | null;
  summary_bn: string | null;
  summary_en: string | null;
  cover_url: string | null;
  status: PublicationStatus;
  activity_count: number;
  published_activity_count: number;
};

export type AdminChapterInput = {
  id?: string;
  classLevel: number;
  subjectId: string;
  chapterNumber: number;
  titleBn: string;
  titleEn?: string;
  summaryBn?: string;
  summaryEn?: string;
  coverUrl?: string;
  status: PublicationStatus;
};

export type AdminActivity = {
  id: string;
  chapter_id: string;
  order_index: number;
  activity_type: SupabaseActivityType;
  title_bn: string | null;
  title_en: string | null;
  instruction_bn: string | null;
  instruction_en: string | null;
  payload: Record<string, unknown>;
  status: PublicationStatus;
};

export type AdminActivityInput = {
  id?: string;
  chapterId: string;
  orderIndex: number;
  activityType: SupabaseActivityType;
  titleBn?: string;
  titleEn?: string;
  instructionBn?: string;
  instructionEn?: string;
  payload: Record<string, unknown>;
  status: PublicationStatus;
};

export type AdminQuizOption = {
  id?: string;
  optionOrder: number;
  labelBn: string;
  labelEn?: string;
  imageUrl?: string;
  isCorrect: boolean;
};

export type AdminQuizQuestion = {
  id: string;
  chapter_id: string;
  activity_id: string | null;
  order_index: number;
  question_bn: string;
  question_en: string | null;
  explanation_bn: string | null;
  explanation_en: string | null;
  image_url: string | null;
  status: PublicationStatus;
  options: AdminQuizOption[];
};

export type AdminQuizQuestionInput = {
  id?: string;
  chapterId: string;
  activityId?: string | null;
  orderIndex: number;
  questionBn: string;
  questionEn?: string;
  explanationBn?: string;
  explanationEn?: string;
  imageUrl?: string;
  status: PublicationStatus;
  options: AdminQuizOption[];
};

type ProfileRow = {
  id: string;
  role: "parent" | "content_creator" | "admin";
  display_name: string | null;
};

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase URL অথবা anon key configure করা নেই।",
    );
  }
}

function throwSupabaseError(
  error: { message: string } | null,
) {
  if (error) {
    throw new Error(error.message);
  }
}

async function getAdminProfile(
  userId: string,
  email?: string,
): Promise<AdminUser> {
  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", userId)
    .single();

  throwSupabaseError(error);

  const profile = data as ProfileRow;

  if (
    profile.role !== "admin" &&
    profile.role !== "content_creator"
  ) {
    throw new Error(
      "এই account-এর Admin Panel access নেই।",
    );
  }

  const safeEmail = email ?? "";

  return {
    id: profile.id,
    email: safeEmail,
    name:
      profile.display_name ??
      safeEmail.split("@")[0] ??
      "Admin",
    role: profile.role,
  };
}

const chapterSelect = `
  id,
  class_level,
  subject_id,
  chapter_number,
  title_bn,
  title_en,
  summary_bn,
  summary_en,
  cover_url,
  status
`;

const activitySelect = `
  id,
  chapter_id,
  order_index,
  activity_type,
  title_bn,
  title_en,
  instruction_bn,
  instruction_en,
  payload,
  status
`;

const quizQuestionSelect = `
  id,
  chapter_id,
  activity_id,
  order_index,
  question_bn,
  question_en,
  explanation_bn,
  explanation_en,
  image_url,
  status
`;

export const adminService = {
  async login(email: string, password: string) {
    ensureConfigured();

    const { data, error } =
      await adminSupabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    throwSupabaseError(error);

    if (!data.user || !data.session) {
      throw new Error(
        "Admin login session তৈরি হয়নি।",
      );
    }

    try {
      return await getAdminProfile(
        data.user.id,
        data.user.email,
      );
    } catch (profileError) {
      await adminSupabase.auth.signOut();
      throw profileError;
    }
  },

  async getCurrentAdmin() {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } =
      await adminSupabase.auth.getSession();

    throwSupabaseError(error);

    const user = data.session?.user;

    if (!user) {
      return null;
    }

    try {
      return await getAdminProfile(
        user.id,
        user.email,
      );
    } catch {
      await adminSupabase.auth.signOut();
      return null;
    }
  },

  async logout() {
    if (!isSupabaseConfigured) {
      return;
    }

    const { error } =
      await adminSupabase.auth.signOut();

    throwSupabaseError(error);
  },

  async listChapters(): Promise<AdminChapter[]> {
    ensureConfigured();

    const [chapterResult, activityResult] =
      await Promise.all([
        adminSupabase
          .from("chapters")
          .select(chapterSelect)
          .order("class_level", {
            ascending: true,
          })
          .order("subject_id", {
            ascending: true,
          })
          .order("chapter_number", {
            ascending: true,
          }),
        adminSupabase
          .from("lesson_activities")
          .select("chapter_id, status"),
      ]);

    throwSupabaseError(chapterResult.error);
    throwSupabaseError(activityResult.error);

    const counts = new Map<
      string,
      {
        total: number;
        published: number;
      }
    >();

    for (const row of activityResult.data ?? []) {
      const chapterId = row.chapter_id as string;
      const current = counts.get(chapterId) ?? {
        total: 0,
        published: 0,
      };

      current.total += 1;

      if (row.status === "published") {
        current.published += 1;
      }

      counts.set(chapterId, current);
    }

    return (chapterResult.data ?? []).map(
      (chapter) => {
        const count = counts.get(chapter.id) ?? {
          total: 0,
          published: 0,
        };

        return {
          ...chapter,
          activity_count: count.total,
          published_activity_count:
            count.published,
        } as AdminChapter;
      },
    );
  },

  async saveChapter(
    input: AdminChapterInput,
  ): Promise<void> {
    ensureConfigured();

    const payload = {
      class_level: input.classLevel,
      subject_id: input.subjectId,
      chapter_number: input.chapterNumber,
      title_bn: input.titleBn.trim(),
      title_en: input.titleEn?.trim() || null,
      summary_bn:
        input.summaryBn?.trim() || null,
      summary_en:
        input.summaryEn?.trim() || null,
      cover_url: input.coverUrl?.trim() || null,
      status: input.status,
    };

    if (input.id) {
      const { error } = await adminSupabase
        .from("chapters")
        .update(payload)
        .eq("id", input.id);

      throwSupabaseError(error);
      return;
    }

    const { error } = await adminSupabase
      .from("chapters")
      .insert(payload);

    throwSupabaseError(error);
  },

  async setChapterStatus(
    chapterId: string,
    status: PublicationStatus,
  ) {
    ensureConfigured();

    const { error } = await adminSupabase
      .from("chapters")
      .update({ status })
      .eq("id", chapterId);

    throwSupabaseError(error);
  },

  async listActivities(
    chapterId: string,
  ): Promise<AdminActivity[]> {
    ensureConfigured();

    const { data, error } = await adminSupabase
      .from("lesson_activities")
      .select(activitySelect)
      .eq("chapter_id", chapterId)
      .order("order_index", {
        ascending: true,
      });

    throwSupabaseError(error);

    return (data ?? []) as AdminActivity[];
  },

  async saveActivity(
    input: AdminActivityInput,
  ): Promise<void> {
    ensureConfigured();

    const payload = {
      chapter_id: input.chapterId,
      order_index: input.orderIndex,
      activity_type: input.activityType,
      title_bn: input.titleBn?.trim() || null,
      title_en: input.titleEn?.trim() || null,
      instruction_bn:
        input.instructionBn?.trim() || null,
      instruction_en:
        input.instructionEn?.trim() || null,
      payload: input.payload,
      status: input.status,
    };

    if (input.id) {
      const { error } = await adminSupabase
        .from("lesson_activities")
        .update(payload)
        .eq("id", input.id);

      throwSupabaseError(error);
      return;
    }

    const { error } = await adminSupabase
      .from("lesson_activities")
      .insert(payload);

    throwSupabaseError(error);
  },

  async setActivityStatus(
    activityId: string,
    status: PublicationStatus,
  ) {
    ensureConfigured();

    const { error } = await adminSupabase
      .from("lesson_activities")
      .update({ status })
      .eq("id", activityId);

    throwSupabaseError(error);
  },

  async deleteActivity(activityId: string) {
    ensureConfigured();

    const { error } = await adminSupabase
      .from("lesson_activities")
      .delete()
      .eq("id", activityId);

    throwSupabaseError(error);
  },

  async listQuizQuestions(
    chapterId: string,
  ): Promise<AdminQuizQuestion[]> {
    ensureConfigured();

    const { data: questionData, error: questionError } =
      await adminSupabase
        .from("quiz_questions")
        .select(quizQuestionSelect)
        .eq("chapter_id", chapterId)
        .order("order_index", { ascending: true });

    throwSupabaseError(questionError);

    const questionIds = (questionData ?? []).map(
      (question) => question.id as string,
    );

    let optionRows: Array<{
      id: string;
      question_id: string;
      option_order: number;
      label_bn: string | null;
      label_en: string | null;
      image_url: string | null;
      is_correct: boolean;
    }> = [];

    if (questionIds.length > 0) {
      const { data, error } = await adminSupabase
        .from("quiz_options")
        .select(
          "id, question_id, option_order, label_bn, label_en, image_url, is_correct",
        )
        .in("question_id", questionIds)
        .order("option_order", { ascending: true });

      throwSupabaseError(error);
      optionRows = data ?? [];
    }

    const optionsByQuestion = new Map<
      string,
      AdminQuizOption[]
    >();

    for (const option of optionRows) {
      const current =
        optionsByQuestion.get(option.question_id) ?? [];

      current.push({
        id: option.id,
        optionOrder: option.option_order,
        labelBn: option.label_bn ?? "",
        labelEn: option.label_en ?? undefined,
        imageUrl: option.image_url ?? undefined,
        isCorrect: option.is_correct,
      });

      optionsByQuestion.set(option.question_id, current);
    }

    return (questionData ?? []).map((question) => ({
      ...question,
      options: optionsByQuestion.get(question.id) ?? [],
    })) as AdminQuizQuestion[];
  },

  async saveQuizQuestion(
    input: AdminQuizQuestionInput,
  ): Promise<void> {
    ensureConfigured();

    const questionPayload = {
      chapter_id: input.chapterId,
      activity_id: input.activityId ?? null,
      order_index: input.orderIndex,
      question_bn: input.questionBn.trim(),
      question_en: input.questionEn?.trim() || null,
      explanation_bn:
        input.explanationBn?.trim() || null,
      explanation_en:
        input.explanationEn?.trim() || null,
      image_url: input.imageUrl?.trim() || null,
      status: input.status,
    };

    let questionId = input.id;

    if (questionId) {
      const { error } = await adminSupabase
        .from("quiz_questions")
        .update(questionPayload)
        .eq("id", questionId);

      throwSupabaseError(error);
    } else {
      const { data, error } = await adminSupabase
        .from("quiz_questions")
        .insert(questionPayload)
        .select("id")
        .single();

      throwSupabaseError(error);
      questionId = data?.id as string | undefined;
    }

    if (!questionId) {
      throw new Error("Quiz question ID তৈরি হয়নি।");
    }

    const { error: deleteError } = await adminSupabase
      .from("quiz_options")
      .delete()
      .eq("question_id", questionId);

    throwSupabaseError(deleteError);

    const optionPayloads = input.options.map(
      (option, index) => ({
        question_id: questionId,
        option_order: index + 1,
        label_bn: option.labelBn.trim(),
        label_en: option.labelEn?.trim() || null,
        image_url: option.imageUrl?.trim() || null,
        is_correct: option.isCorrect,
      }),
    );

    const { error: optionError } = await adminSupabase
      .from("quiz_options")
      .insert(optionPayloads);

    throwSupabaseError(optionError);
  },

  async setQuizQuestionStatus(
    questionId: string,
    status: PublicationStatus,
  ) {
    ensureConfigured();

    const { error } = await adminSupabase
      .from("quiz_questions")
      .update({ status })
      .eq("id", questionId);

    throwSupabaseError(error);
  },

  async deleteQuizQuestion(questionId: string) {
    ensureConfigured();

    const { error: optionError } = await adminSupabase
      .from("quiz_options")
      .delete()
      .eq("question_id", questionId);

    throwSupabaseError(optionError);

    const { error: questionError } = await adminSupabase
      .from("quiz_questions")
      .delete()
      .eq("id", questionId);

    throwSupabaseError(questionError);
  },

  async hasPublishedQuizQuestions(
    chapterId: string,
    activityId?: string | null,
  ) {
    ensureConfigured();

    let query = adminSupabase
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("chapter_id", chapterId)
      .eq("status", "published");

    if (activityId) {
      query = query.eq("activity_id", activityId);
    }

    const { count, error } = await query;
    throwSupabaseError(error);

    return (count ?? 0) > 0;
  },
};