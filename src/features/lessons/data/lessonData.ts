export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
};

export type LessonChapter = {
  chapterId: string;
  quizId: string;
  title: string;
  description: string;
  videoUrl: string;
  starsReward: number;
  passingScore: number;
  nextChapterId?: string;
  quiz: QuizQuestion[];
};

export type LessonSubject = {
  subjectId: string;
  name: string;
  emoji: string;
  chapters: LessonChapter[];
};

export type LessonClass = {
  classId: number;
  name: string;
  subjects: LessonSubject[];
};

const demoVideo =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const lessonData: LessonClass[] = [
  {
    classId: 1,
    name: 'Class 1',
    subjects: [
      {
        subjectId: 'bangla',
        name: 'Bangla',
        emoji: '📘',
        chapters: [
          {
            chapterId: 'class1-bangla-c1',
            quizId: 'class1-bangla-c1-quiz',
            title: 'Bangla Letters',
            description: 'Learn simple Bangla letters.',
            videoUrl: demoVideo,
            starsReward: 10,
            passingScore: 2,
            nextChapterId: 'class1-bangla-c2',
            quiz: [
              {
                id: 'q1',
                question: 'Which one is a Bangla vowel?',
                options: ['অ', 'ক', 'গ', 'ম'],
                correctAnswerIndex: 0,
              },
              {
                id: 'q2',
                question: 'Which letter comes after অ?',
                options: ['আ', 'ক', 'খ', 'গ'],
                correctAnswerIndex: 0,
              },
              {
                id: 'q3',
                question: 'Bangla is written from which side?',
                options: ['Left to right', 'Right to left', 'Top to bottom', 'Circle way'],
                correctAnswerIndex: 0,
              },
            ],
          },
          {
            chapterId: 'class1-bangla-c2',
            quizId: 'class1-bangla-c2-quiz',
            title: 'Simple Bangla Words',
            description: 'Learn easy words and sounds.',
            videoUrl: demoVideo,
            starsReward: 10,
            passingScore: 2,
            quiz: [
              {
                id: 'q1',
                question: 'Which is a simple Bangla word?',
                options: ['মা', 'ABC', '123', 'Dog only'],
                correctAnswerIndex: 0,
              },
              {
                id: 'q2',
                question: 'What does মা mean?',
                options: ['Mother', 'Book', 'Sun', 'River'],
                correctAnswerIndex: 0,
              },
              {
                id: 'q3',
                question: 'Which word is related to school?',
                options: ['বই', 'চাঁদ', 'মাছ', 'পাখি'],
                correctAnswerIndex: 0,
              },
            ],
          },
        ],
      },
      {
        subjectId: 'math',
        name: 'Math',
        emoji: '🔢',
        chapters: [
          {
            chapterId: 'class1-math-c1',
            quizId: 'class1-math-c1-quiz',
            title: 'Numbers 1 to 10',
            description: 'Learn counting from 1 to 10.',
            videoUrl: demoVideo,
            starsReward: 10,
            passingScore: 2,
            nextChapterId: 'class1-math-c2',
            quiz: [
              {
                id: 'q1',
                question: 'What comes after 3?',
                options: ['2', '4', '6', '9'],
                correctAnswerIndex: 1,
              },
              {
                id: 'q2',
                question: 'How many fingers are on one hand?',
                options: ['3', '4', '5', '10'],
                correctAnswerIndex: 2,
              },
              {
                id: 'q3',
                question: 'Which number is bigger?',
                options: ['2', '8', '1', '3'],
                correctAnswerIndex: 1,
              },
            ],
          },
          {
            chapterId: 'class1-math-c2',
            quizId: 'class1-math-c2-quiz',
            title: 'Simple Addition',
            description: 'Learn small addition.',
            videoUrl: demoVideo,
            starsReward: 10,
            passingScore: 2,
            quiz: [
              {
                id: 'q1',
                question: '1 + 1 = ?',
                options: ['1', '2', '3', '4'],
                correctAnswerIndex: 1,
              },
              {
                id: 'q2',
                question: '2 + 1 = ?',
                options: ['2', '3', '4', '5'],
                correctAnswerIndex: 1,
              },
              {
                id: 'q3',
                question: '3 + 2 = ?',
                options: ['4', '5', '6', '7'],
                correctAnswerIndex: 1,
              },
            ],
          },
        ],
      },
      {
        subjectId: 'english',
        name: 'English',
        emoji: '🔤',
        chapters: [
          {
            chapterId: 'class1-english-c1',
            quizId: 'class1-english-c1-quiz',
            title: 'English Alphabet',
            description: 'Learn A, B, C.',
            videoUrl: demoVideo,
            starsReward: 10,
            passingScore: 2,
            quiz: [
              {
                id: 'q1',
                question: 'Which letter comes after A?',
                options: ['B', 'C', 'D', 'E'],
                correctAnswerIndex: 0,
              },
              {
                id: 'q2',
                question: 'Which one is a vowel?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswerIndex: 0,
              },
              {
                id: 'q3',
                question: 'Which word starts with B?',
                options: ['Ball', 'Cat', 'Dog', 'Egg'],
                correctAnswerIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    classId: 2,
    name: 'Class 2',
    subjects: [
      {
        subjectId: 'math',
        name: 'Math',
        emoji: '🔢',
        chapters: [
          {
            chapterId: 'class2-math-c1',
            quizId: 'class2-math-c1-quiz',
            title: 'Addition Practice',
            description: 'Practice addition with bigger numbers.',
            videoUrl: demoVideo,
            starsReward: 10,
            passingScore: 2,
            quiz: [
              {
                id: 'q1',
                question: '10 + 5 = ?',
                options: ['12', '14', '15', '20'],
                correctAnswerIndex: 2,
              },
              {
                id: 'q2',
                question: '8 + 2 = ?',
                options: ['9', '10', '11', '12'],
                correctAnswerIndex: 1,
              },
              {
                id: 'q3',
                question: '7 + 3 = ?',
                options: ['8', '9', '10', '11'],
                correctAnswerIndex: 2,
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getClassById(classId: number) {
  return lessonData.find((item) => item.classId === classId);
}

export function getSubjectById(classId: number, subjectId: string) {
  return getClassById(classId)?.subjects.find((item) => item.subjectId === subjectId);
}

export function getChapterById(chapterId: string) {
  for (const classItem of lessonData) {
    for (const subject of classItem.subjects) {
      const chapter = subject.chapters.find((item) => item.chapterId === chapterId);

      if (chapter) {
        return {
          classItem,
          subject,
          chapter,
        };
      }
    }
  }

  return null;
}