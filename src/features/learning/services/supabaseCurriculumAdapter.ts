import type {
  Activity,
  CurriculumChapter,
} from "../data/curriculum";

import type {
  SupabaseCurriculumChapter,
  SupabaseLessonActivity,
  SupabaseQuizQuestion,
} from "../types/supabaseCurriculum";

type AdapterOptions = {
  nextChapterId?: string;
  chapterIcon?: string;
};

export function adaptSupabaseChapter(
  chapter: SupabaseCurriculumChapter,
  options: AdapterOptions = {},
): CurriculumChapter {
  const orderedActivities = [
    ...chapter.lesson_activities,
  ].sort(
    (a, b) => a.order_index - b.order_index,
  );

  const activities = orderedActivities.flatMap(
    (activity) =>
      adaptActivity(chapter, activity),
  );

  return {
    id: chapter.id,
    title: chapter.title_bn,
    subtitle:
      chapter.summary_bn ??
      `পাঠ ${chapter.chapter_number}`,
    icon: options.chapterIcon ?? "📘",
    nextChapterId: options.nextChapterId,
    activities,
  };
}

function adaptActivity(
  chapter: SupabaseCurriculumChapter,
  activity: SupabaseLessonActivity,
): Activity[] {
  const title =
    activity.title_bn ??
    activity.title_en ??
    "শেখার কাজ";

  const instruction =
    activity.instruction_bn ??
    activity.instruction_en ??
    "";

  switch (activity.activity_type) {
    case "story_snippet": {
      return activity.payload.slides.flatMap(
        (slide, index): Activity[] => {
          const text = (
            slide.text_bn ||
            slide.speech_bn ||
            ""
          ).trim();

          if (!text) {
            return [];
          }

          return [
            {
              id: `${activity.id}-${
                slide.id || index + 1
              }`,
              type: "snippet",
              title,
              imageEmoji:
                slide.emoji ?? "📖",
              lines: [text],
            },
          ];
        },
      );
    }

    case "image_lesson":
      return [
        {
          id: activity.id,
          type: "image_lesson",
          title,
          instruction,
          imageUrl:
            activity.payload.image_url,
          pageStart:
            activity.payload.page_start,
          pageEnd:
            activity.payload.page_end,
          sourceLabel:
            activity.payload.source_label ??
            "NCTB পাঠ্যবই",
        },
      ];

    case "audio_lesson":
      return activity.payload.items.flatMap(
        (item, index): Activity[] => {
          const text = item.text_bn.trim();

          if (!text) {
            return [];
          }

          return [
            {
              id: `${activity.id}-${
                item.id || index + 1
              }`,
              type: "voice",
              prompt: instruction || title,
              word: text,
              emoji: item.emoji ?? "🎤",
            },
          ];
        },
      );

    case "video_lesson":
      return activity.payload.video_url
        ? [
            {
              id: activity.id,
              type: "video",
              title,
              url: activity.payload.video_url,
            },
          ]
        : [];

    case "flashcard": {
      const cards = activity.payload.cards
        .map((card) => ({
          emoji: card.emoji ?? "🖼️",
          word: card.word_bn,
        }))
        .filter(
          (card) => card.word.trim().length > 0,
        );

      if (!cards.length) {
        return [];
      }

      return [
        {
          id: activity.id,
          type: "flashcard",
          prompt: instruction || title,
          cards,
        },
      ];
    }

    case "matching": {
      const pairs = activity.payload.pairs
        .map((pair) => ({
          emoji: pair.emoji ?? "🖼️",
          word: pair.word_bn,
        }))
        .filter(
          (pair) => pair.word.trim().length > 0,
        );

      if (!pairs.length) {
        return [];
      }

      return [
        {
          id: activity.id,
          type: "matching",
          prompt: instruction || title,
          pairs,
        },
      ];
    }

    case "multiple_choice":
      return adaptQuizQuestions(
        chapter.quiz_questions,
        activity.id,
      );

    case "tap": {
      const items = activity.payload.items
        .map((item, index) => ({
          id:
            item.id ||
            `${activity.id}-item-${index + 1}`,
          emoji: item.emoji ?? "🖼️",
          label: item.label_bn,
          description:
            item.description_bn ??
            item.label_bn,
        }))
        .filter(
          (item) => item.label.trim().length > 0,
        );

      if (!items.length) {
        return [];
      }

      return [
        {
          id: activity.id,
          type: "tap",
          prompt:
            activity.payload.prompt ||
            instruction ||
            title,
          items,
        },
      ];
    }

    case "snippet": {
      const lines = activity.payload.lines.filter(
        (line) => line.trim().length > 0,
      );

      if (!lines.length) {
        return [];
      }

      return [
        {
          id: activity.id,
          type: "snippet",
          title,
          imageEmoji:
            activity.payload.imageEmoji ??
            "📖",
          lines,
        },
      ];
    }

    case "letter":
      return [
        {
          id: activity.id,
          type: "letter",
          letter: activity.payload.letter,
          sound:
            activity.payload.sound ??
            activity.payload.letter,
          examples: (
            activity.payload.examples ?? []
          ).map((item) => ({
            emoji: item.emoji ?? "🖼️",
            word: item.word_bn,
          })),
        },
      ];

    case "word_build":
      return [
        {
          id: activity.id,
          type: "word_build",
          prompt: instruction || title,
          letters: activity.payload.letters,
          answer: activity.payload.answer,
        },
      ];

    case "picture_choice":
      return [
        {
          id: activity.id,
          type: "picture_choice",
          question:
            activity.payload.question,
          options:
            activity.payload.options.map(
              (item) => ({
                emoji:
                  item.emoji ?? "🖼️",
                label: item.label_bn,
              }),
            ),
          answer: activity.payload.answer,
        },
      ];

    case "drag_game":
      return [
        {
          id: activity.id,
          type: "drag_game",
          prompt:
            activity.payload.prompt ||
            instruction ||
            title,
          items: activity.payload.items.map(
            (item) => ({
              emoji: item.emoji ?? "🖼️",
              target: item.target,
            }),
          ),
        },
      ];

    default:
      return [];
  }
}

function adaptQuizQuestions(
  questions: SupabaseQuizQuestion[],
  activityId: string,
): Activity[] {
  const linkedQuestions = questions.filter(
    (question) =>
      question.activity_id === activityId,
  );

  const compatibleQuestions =
    linkedQuestions.length > 0
      ? linkedQuestions
      : questions.filter(
          (question) =>
            question.activity_id === null,
        );

  return [...compatibleQuestions]
    .sort(
      (a, b) =>
        a.order_index - b.order_index,
    )
    .flatMap((question): Activity[] => {
      const options = [
        ...question.quiz_options,
      ].sort(
        (a, b) =>
          a.option_order - b.option_order,
      );

      const correctAnswer = options.findIndex(
        (option) => option.is_correct,
      );

      if (
        correctAnswer < 0 ||
        options.length < 2
      ) {
        return [];
      }

      return [
        {
          id: question.id,
          type: "quiz",
          question: question.question_bn,
          options: options.map(
            (option) =>
              option.label_bn ??
              option.label_en ??
              "",
          ),
          answer: correctAnswer,
          hint:
            question.explanation_bn ??
            "আবার চেষ্টা করো।",
        },
      ];
    });
}