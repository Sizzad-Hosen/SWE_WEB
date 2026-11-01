import { supabase } from '../../../config/supabase';

import type {
  PublicationStatus,
  SupabaseCurriculumChapter,
  SupabaseLessonActivity,
  SupabaseQuizOption,
  SupabaseQuizQuestion,
} from '../types/supabaseCurriculum';

export type ChapterListItem = {
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
};

type ChapterRequestOptions = {
  includeDrafts?: boolean;
};

/**
 * Loads the published chapter list for a class and subject.
 * This will be used by ChapterPathScreen.
 */
export async function getPublishedChapters(
  classLevel: number,
  subjectId: string
): Promise<ChapterListItem[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select(`
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
    `)
    .eq('class_level', classLevel)
    .eq('subject_id', subjectId)
    .eq('status', 'published')
    .order('chapter_number', { ascending: true });

  if (error) {
    throw new Error(`Chapter list load failed: ${error.message}`);
  }

  const chapters = (data ?? []) as ChapterListItem[];

  if (chapters.length === 0) {
    return [];
  }

  // A chapter is student-ready only after at least one activity is published.
  // This lets content editors publish chapter records early without exposing
  // empty lessons in the mobile app.
  const { data: activityRows, error: activityError } = await supabase
    .from('lesson_activities')
    .select('chapter_id')
    .in(
      'chapter_id',
      chapters.map((chapter) => chapter.id)
    )
    .eq('status', 'published');

  if (activityError) {
    throw new Error(
      `Published activity check failed: ${activityError.message}`
    );
  }

  const readyChapterIds = new Set(
    (activityRows ?? []).map((row) => row.chapter_id as string)
  );

  return chapters.filter((chapter) => readyChapterIds.has(chapter.id));
}

/**
 * Loads one complete chapter, including:
 * - lesson activities
 * - quiz questions
 * - quiz options
 *
 * Normal student screens should not set includeDrafts to true.
 */
export async function getCurriculumChapter(
  chapterId: string,
  options: ChapterRequestOptions = {}
): Promise<SupabaseCurriculumChapter | null> {
  const includeDrafts = options.includeDrafts === true;

  let chapterQuery = supabase
    .from('chapters')
    .select(`
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
    `)
    .eq('id', chapterId);

  if (!includeDrafts) {
    chapterQuery = chapterQuery.eq('status', 'published');
  }

  const { data: chapterData, error: chapterError } =
    await chapterQuery.maybeSingle();

  if (chapterError) {
    throw new Error(`Chapter load failed: ${chapterError.message}`);
  }

  if (!chapterData) {
    return null;
  }

  let activityQuery = supabase
    .from('lesson_activities')
    .select(`
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
    `)
    .eq('chapter_id', chapterId);

  let questionQuery = supabase
    .from('quiz_questions')
    .select(`
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
    `)
    .eq('chapter_id', chapterId);

  if (!includeDrafts) {
    activityQuery = activityQuery.eq('status', 'published');
    questionQuery = questionQuery.eq('status', 'published');
  }

  const [activityResult, questionResult] = await Promise.all([
    activityQuery.order('order_index', { ascending: true }),
    questionQuery.order('order_index', { ascending: true }),
  ]);

  if (activityResult.error) {
    throw new Error(
      `Lesson activities load failed: ${activityResult.error.message}`
    );
  }

  if (questionResult.error) {
    throw new Error(
      `Quiz questions load failed: ${questionResult.error.message}`
    );
  }

  const activities =
    (activityResult.data ?? []) as SupabaseLessonActivity[];

  const rawQuestions = questionResult.data ?? [];
  const questionIds = rawQuestions.map((question) => question.id);

  let optionsData: SupabaseQuizOption[] = [];

  if (questionIds.length > 0) {
    const { data, error } = await supabase
      .from('quiz_options')
      .select(`
        id,
        question_id,
        option_order,
        label_bn,
        label_en,
        image_url,
        is_correct
      `)
      .in('question_id', questionIds)
      .order('option_order', { ascending: true });

    if (error) {
      throw new Error(`Quiz options load failed: ${error.message}`);
    }

    optionsData = (data ?? []) as SupabaseQuizOption[];
  }

  const optionsByQuestion = new Map<string, SupabaseQuizOption[]>();

  for (const option of optionsData) {
    const current = optionsByQuestion.get(option.question_id) ?? [];
    current.push(option);
    optionsByQuestion.set(option.question_id, current);
  }

  const quizQuestions: SupabaseQuizQuestion[] = rawQuestions.map(
    (question) => ({
      ...question,
      quiz_options: optionsByQuestion.get(question.id) ?? [],
    })
  ) as SupabaseQuizQuestion[];

  return {
    ...chapterData,
    lesson_activities: activities,
    quiz_questions: quizQuestions,
  } as SupabaseCurriculumChapter;
}
