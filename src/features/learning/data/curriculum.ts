// =====================================
// NCTB Kids Beginner Curriculum Engine
// =====================================

// ---------- Activity Types ----------

export type IntroActivity = {
  id: string;
  type: "intro";
  title: string;
  body: string;
};

export type AudioStoryActivity = {
  id: string;
  type: "audio_story";
  title: string;
  text: string;
  audio?: string;
};

export type ImageLessonActivity = {
  id: string;
  type: "image_lesson";
  title: string;
  instruction: string;
  imageUrl?: string;
  pageStart?: number;
  pageEnd?: number;
  sourceLabel: string;
};

export type VideoLessonActivity = {
  id: string;
  type: "video";
  title: string;
  url: string;
};

export type SnippetActivity = {
  id: string;
  type: "snippet";
  title: string;
  imageEmoji: string;
  lines: string[];
};

export type LetterActivity = {
  id: string;
  type: "letter";
  letter: string;
  sound: string;
  examples: {
    emoji: string;
    word: string;
  }[];
};

export type WordBuildActivity = {
  id: string;
  type: "word_build";
  prompt: string;
  letters: string[];
  answer: string;
};

export type TapActivity = {
  id: string;
  type: "tap";
  prompt: string;
  items: {
    id: string;
    emoji: string;
    label: string;
    description: string;
  }[];
};

export type FlashcardActivity = {
  id: string;
  type: "flashcard";
  prompt: string;
  cards: {
    emoji: string;
    word: string;
  }[];
};

export type VoiceActivity = {
  id: string;
  type: "voice";
  prompt: string;
  word: string;
  emoji: string;
};

export type MatchingActivity = {
  id: string;
  type: "matching";
  prompt: string;
  pairs: {
    emoji: string;
    word: string;
  }[];
};

export type PictureChoiceActivity = {
  id: string;
  type: "picture_choice";
  question: string;
  options: {
    emoji: string;
    label: string;
  }[];
  answer: number;
};

export type DragGameActivity = {
  id: string;
  type: "drag_game";
  prompt: string;
  items: {
    emoji: string;
    target: string;
  }[];
};

export type ChoiceActivity = {
  id: string;
  type: "choice";
  prompt: string;
  options: string[];
  answer: number;
  hint: string;
};

export type QuizActivity = {
  id: string;
  type: "quiz";
  question: string;
  options: string[];
  answer: number;
  hint: string;
};

export type Activity =
  | IntroActivity
  | AudioStoryActivity
  | ImageLessonActivity
  | VideoLessonActivity
  | SnippetActivity
  | LetterActivity
  | WordBuildActivity
  | TapActivity
  | FlashcardActivity
  | VoiceActivity
  | MatchingActivity
  | PictureChoiceActivity
  | DragGameActivity
  | ChoiceActivity
  | QuizActivity;

// ---------- Chapter ----------

export type CurriculumChapter = {
  id: string;

  title: string;

  subtitle: string;

  icon: string;

  nextChapterId?: string;

  activities: Activity[];
};

// ---------- Subject ----------

export type CurriculumSubject = {
  id: string;

  title: string;

  title_bn: string;

  subtitle: string;

  color: string;

  icon: string;

  chapters: CurriculumChapter[];
};

// =====================================
// CLASS 1 BANGLA
// CHAPTER 1
// =====================================

const class1BanglaChapters: CurriculumChapter[] = [
  {
    id: "c1-bangla-letter-1",

    title: "স্বরবর্ণ আ",

    subtitle: "আ অক্ষর চিনে শব্দ তৈরি করি",

    icon: "🔤",

    nextChapterId: "c1-bangla-letter-2",

    activities: [
      // 1

      {
        id: "a-intro",

        type: "intro",

        title: "আজকের নতুন অক্ষর",

        body: "আজ আমরা আ অক্ষর শিখব। আ দিয়ে নতুন শব্দ তৈরি করব।",
      },

      // 2

      {
        id: "a-audio",

        type: "audio_story",

        title: "শুনে শিখি",

        text: "আ। আ দিয়ে আম।",

        audio: "letter-a",
      },

      // 3

      {
        id: "a-letter",

        type: "letter",

        letter: "আ",

        sound: "আ",

        examples: [
          {
            emoji: "🥭",
            word: "আম",
          },

          {
            emoji: "🌹",
            word: "গোলাপ",
          },
        ],
      },

      // 4

      {
        id: "a-story",

        type: "snippet",

        title: "ছোট গল্প",

        imageEmoji: "🥭👧",

        lines: ["আমি একটি আম খাই।", "আম একটি ফল।", "আম খুব মজার।"],
      },

      // 5

      {
        id: "a-word-build",

        type: "word_build",

        prompt: "অক্ষর সাজিয়ে শব্দ তৈরি করো",

        letters: ["আ", "ম"],

        answer: "আম",
      },

      // 6

      {
        id: "a-picture",

        type: "picture_choice",

        question: "কোনটি আম?",

        options: [
          {
            emoji: "🍎",
            label: "আপেল",
          },

          {
            emoji: "🥭",
            label: "আম",
          },

          {
            emoji: "🍌",
            label: "কলা",
          },
        ],

        answer: 1,
      },

      // 7

      {
        id: "a-flashcard",

        type: "flashcard",

        prompt: "নতুন শব্দ মনে রাখি",

        cards: [
          {
            emoji: "🥭",
            word: "আম",
          },

          {
            emoji: "🌹",
            word: "ফুল",
          },
        ],
      },

      // 8

      {
        id: "a-tap",

        type: "tap",

        prompt: "ছবিতে চাপ দিয়ে শেখো",

        items: [
          {
            id: "mango",

            emoji: "🥭",

            label: "আম",

            description: "আম একটি ফল।",
          },

          {
            id: "flower",

            emoji: "🌹",

            label: "ফুল",

            description: "ফুল সুন্দর।",
          },
        ],
      },

      // 9

      {
        id: "a-voice",

        type: "voice",

        prompt: "আম শব্দটি বলো",

        word: "আম",

        emoji: "🎤",
      },

      // 10

      {
        id: "a-match",

        type: "matching",

        prompt: "সঠিক মিল খুঁজে বের করো",

        pairs: [
          {
            emoji: "🥭",
            word: "আম",
          },

          {
            emoji: "🌹",
            word: "ফুল",
          },
        ],
      },

      // 11

      {
        id: "a-drag",

        type: "drag_game",

        prompt: "আমকে ফলের ঘরে নিয়ে যাও",

        items: [
          {
            emoji: "🥭",
            target: "ফল",
          },
        ],
      },

      // 12 Final

      {
        id: "a-final",

        type: "quiz",

        question: "আ দিয়ে কোন শব্দ হয়?",

        options: ["আম", "মাছ", "বই", "ঘর"],

        answer: 0,

        hint: "আজকের শব্দ মনে করো।",
      },
    ],
  },
];

// =====================================
// MORE CLASS 1 BANGLA CHAPTERS
// =====================================

const extraBanglaChapters: CurriculumChapter[] = [
  {
    id: "c1-bangla-letter-2",

    title: "ব্যঞ্জনবর্ণ ক",

    subtitle: "ক অক্ষর চিনে শব্দ তৈরি করি",

    icon: "🔤",

    nextChapterId: "c1-bangla-letter-3",

    activities: [
      {
        id: "ka-intro",

        type: "intro",

        title: "ক অক্ষর",

        body: "আজ আমরা ক অক্ষর শিখব। ক দিয়ে নতুন শব্দ তৈরি করব।",
      },

      {
        id: "ka-letter",

        type: "letter",

        letter: "ক",

        sound: "ক",

        examples: [
          {
            emoji: "🐦",
            word: "কাক",
          },

          {
            emoji: "📖",
            word: "কলম",
          },
        ],
      },

      {
        id: "ka-word",

        type: "word_build",

        prompt: "অক্ষর সাজিয়ে শব্দ তৈরি করো",

        letters: ["ক", "ল", "ম"],

        answer: "কলম",
      },

      {
        id: "ka-picture",

        type: "picture_choice",

        question: "ক দিয়ে কোনটি হয়?",

        options: [
          {
            emoji: "🐦",
            label: "কাক",
          },

          {
            emoji: "🐟",
            label: "মাছ",
          },

          {
            emoji: "🥭",
            label: "আম",
          },
        ],

        answer: 0,
      },

      {
        id: "ka-final",

        type: "quiz",

        question: "ক দিয়ে কোন শব্দ শুরু হয়?",

        options: ["কাক", "আম", "বই", "ফুল"],

        answer: 0,

        hint: "ক অক্ষরের কথা মনে করো।",
      },
    ],
  },

  {
    id: "c1-bangla-letter-3",

    title: "শব্দ তৈরি করি",

    subtitle: "অক্ষর মিলিয়ে শব্দ শেখা",

    icon: "📝",

    activities: [
      {
        id: "word-intro",

        type: "intro",

        title: "শব্দ শেখা",

        body: "আজ আমরা অক্ষর মিলিয়ে শব্দ তৈরি করব।",
      },

      {
        id: "word-build",

        type: "word_build",

        prompt: "অক্ষর মিলিয়ে শব্দ বানাও",

        letters: ["ব", "ই"],

        answer: "বই",
      },

      {
        id: "word-match",

        type: "matching",

        prompt: "শব্দের সঙ্গে ছবি মিলাও",

        pairs: [
          {
            emoji: "📖",
            word: "বই",
          },

          {
            emoji: "🥭",
            word: "আম",
          },
        ],
      },

      {
        id: "word-quiz",

        type: "quiz",

        question: "বই দিয়ে আমরা কী করি?",

        options: ["পড়ি", "খাই", "ঘুমাই", "দৌড়াই"],

        answer: 0,

        hint: "শেখার কথা ভাবো।",
      },
    ],
  },
];

// =====================================
// SUBJECT BUILDER
// =====================================

function buildSubjects(classId: number): CurriculumSubject[] {
  const bangla =
    classId === 1
      ? [...class1BanglaChapters, ...extraBanglaChapters]
      : [
          {
            id: `c${classId}-bangla-1`,

            title: `Class ${classId} Bangla`,

            subtitle: "বাংলা শেখা",

            icon: "📘",

            activities: [],
          },
        ];

  return [
    {
      id: "bangla",

      title: "Bangla",

      title_bn: "বাংলা",

      subtitle: "অক্ষর, শব্দ ও বাক্য শেখা",

      color: "#FFD166",

      icon: "📘",

      chapters: bangla,
    },

    {
      id: "english",

      title: "English",

      title_bn: "ইংরেজি",

      subtitle: "Basic English learning",

      color: "#7BDFF2",

      icon: "🔤",

      chapters: [
        {
          id: `c${classId}-english-1`,

          title: "Alphabet",

          subtitle: "Learn English letters",

          icon: "🔤",

          activities: [
            {
              id: "english-intro",

              type: "intro",

              title: "English Alphabet",

              body: "Let's learn English letters.",
            },

            {
              id: "english-letter",

              type: "letter",

              letter: "A",

              sound: "A",

              examples: [
                {
                  emoji: "🍎",
                  word: "Apple",
                },
              ],
            },

            {
              id: "english-quiz",

              type: "quiz",

              question: "Which word starts with A?",

              options: ["Apple", "Ball", "Cat", "Dog"],

              answer: 0,

              hint: "Think about A.",
            },
          ],
        },
      ],
    },

    {
      id: "math",

      title: "Mathematics",

      title_bn: "গণিত",

      subtitle: "সংখ্যা ও হিসাব শেখা",

      color: "#95D5B2",

      icon: "➕",

      chapters: [
        {
          id: `c${classId}-math-1`,

          title: "Numbers",

          subtitle: "Learn numbers",

          icon: "🔢",

          activities: [
            {
              id: "number-intro",

              type: "intro",

              title: "সংখ্যা",

              body: "আজ আমরা সংখ্যা শিখব।",
            },

            {
              id: "number-picture",

              type: "picture_choice",

              question: "কোনটি ১?",

              options: [
                {
                  emoji: "1️⃣",
                  label: "এক",
                },

                {
                  emoji: "5️⃣",
                  label: "পাঁচ",
                },

                {
                  emoji: "9️⃣",
                  label: "নয়",
                },
              ],

              answer: 0,
            },

            {
              id: "number-quiz",

              type: "quiz",

              question: "১ এর পরে কোন সংখ্যা?",

              options: ["২", "৫", "৮", "৯"],

              answer: 0,

              hint: "গুনতে থাকো।",
            },
          ],
        },
      ],
    },
  ];
}

// =====================================
// FULL CURRICULUM
// =====================================

const curriculum = [1, 2, 3].flatMap((classId) =>
  buildSubjects(classId).map((subject) => ({
    classId,

    subject,
  })),
);

// =====================================
// GET SUBJECTS
// =====================================

export function getSubjects(classId: number): CurriculumSubject[] {
  return curriculum

    .filter((item) => item.classId === classId)

    .map((item) => item.subject);
}

// =====================================
// GET SUBJECT
// =====================================

export function getSubject(
  classId: number,

  subjectId: string,
): CurriculumSubject | undefined {
  return curriculum.find(
    (item) => item.classId === classId && item.subject.id === subjectId,
  )?.subject;
}

// =====================================
// GET CHAPTER
// =====================================

export function getChapter(chapterId: string) {
  for (const item of curriculum) {
    const chapter = item.subject.chapters.find(
      (chapter) => chapter.id === chapterId,
    );

    if (chapter) {
      return {
        classId: item.classId,

        subject: item.subject,

        chapter,
      };
    }
  }

  return undefined;
}
