import { supabase } from "../../../config/supabase";
import { useLessonSessionStore } from "../store/lessonSessionStore";

type QuizQuestionRow = {
  id: string;
};

type QuizOptionRow = {
  id: string;
  question_id: string;
  option_order: number;
  is_correct: boolean;
};

type ExistingAttemptRow = {
  question_id: string;
  is_correct: boolean;
};

function throwSupabaseError(
  error: { message: string } | null,
) {
  if (error) {
    throw new Error(error.message);
  }
}

async function submitQuizAnswer(
  studentId: string,
  questionId: string,
  selectedOptionId: string,
) {
  const { error } = await supabase.rpc(
    "submit_quiz_answer",
    {
      p_student_id: studentId,
      p_question_id: questionId,
      p_selected_option_id: selectedOptionId,
    },
  );

  throwSupabaseError(error);
}

async function syncQuizAttempts(
  studentId: string,
  chapterId: string,
) {
  const {
    data: questionData,
    error: questionError,
  } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("chapter_id", chapterId)
    .eq("status", "published")
    .order("order_index", {
      ascending: true,
    });

  throwSupabaseError(questionError);

  const questions =
    (questionData ?? []) as unknown as QuizQuestionRow[];

  if (questions.length === 0) {
    return;
  }

  const questionIds = questions.map(
    (question) => question.id,
  );

  const [optionResult, attemptResult] =
    await Promise.all([
      supabase
        .from("quiz_options")
        .select(
          "id, question_id, option_order, is_correct",
        )
        .in("question_id", questionIds)
        .order("option_order", {
          ascending: true,
        }),

      supabase
        .from("activity_attempts")
        .select("question_id, is_correct")
        .eq("student_id", studentId)
        .in("question_id", questionIds),
    ]);

  throwSupabaseError(optionResult.error);
  throwSupabaseError(attemptResult.error);

  const options =
    (optionResult.data ?? []) as unknown as QuizOptionRow[];

  const existingAttempts =
    (attemptResult.data ?? []) as unknown as ExistingAttemptRow[];

  const attemptsByActivity =
    useLessonSessionStore.getState().sessions[
      chapterId
    ]?.attemptsByActivity ?? {};

  for (const question of questions) {
    const questionOptions = options
      .filter(
        (option) =>
          option.question_id === question.id,
      )
      .sort(
        (a, b) =>
          a.option_order - b.option_order,
      );

    const correctOption =
      questionOptions.find(
        (option) => option.is_correct,
      );

    const wrongOption =
      questionOptions.find(
        (option) => !option.is_correct,
      );

    if (!correctOption) {
      throw new Error(
        "Published quiz question-এর correct option পাওয়া যায়নি।",
      );
    }

    const savedAttempts =
      existingAttempts.filter(
        (attempt) =>
          attempt.question_id === question.id,
      );

    if (
      savedAttempts.some(
        (attempt) => attempt.is_correct,
      )
    ) {
      continue;
    }

    const localAttemptCount = Math.max(
      1,
      attemptsByActivity[question.id] ?? 1,
    );

    const missingAttemptCount = Math.max(
      1,
      localAttemptCount - savedAttempts.length,
    );

    const wrongAttemptsToSend = wrongOption
      ? Math.max(0, missingAttemptCount - 1)
      : 0;

    for (
      let index = 0;
      index < wrongAttemptsToSend;
      index += 1
    ) {
      await submitQuizAnswer(
        studentId,
        question.id,
        wrongOption!.id,
      );
    }

    await submitQuizAnswer(
      studentId,
      question.id,
      correctOption.id,
    );
  }
}

export const progressService = {
  async completeChapter(
    studentId: string,
    chapterId: string,
  ) {
    await syncQuizAttempts(
      studentId,
      chapterId,
    );

    const { data, error } = await supabase.rpc(
      "complete_chapter",
      {
        p_student_id: studentId,
        p_chapter_id: chapterId,
      },
    );

    throwSupabaseError(error);

    return data;
  },
};