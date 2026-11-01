import type { NativeStackScreenProps } from "../web/navigation";

export type RootStackParamList = {
  Subjects: { classId?: number } | undefined;
  ChapterPath: {
    classId: number;
    subjectId: string;
  };
  Lesson: { chapterId: string };
  Leaderboard: undefined;
  Progress: undefined;
  Donation: undefined;
  Settings: undefined;
  AdultGate: {
    destination: "parent" | "admin";
  };
  ParentDashboard: undefined;
  AdminLogin: undefined;
  AdminDashboard: undefined;
  AdminContentEditor: {
    chapterId: string;
    chapterTitle: string;
  };
  AdminQuizEditor: {
    chapterId: string;
    chapterTitle: string;
    activityId?: string;
  };
  Home: undefined;
  ChapterList: {
    classId: number;
    subjectId: string;
  };
  Player: {
    chapterId: string;
    title: string;
    videoUrl: string;
    quizId: string;
    nextChapterId?: string;
  };
  Quiz: {
    chapterId: string;
    quizId: string;
    nextChapterId?: string;
  };
  StudentSetup: undefined;
  MainApp: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ClassSelection: undefined;
  LeaderboardLegacy: undefined;
  ParentDashboardLegacy: undefined;
};

export type ScreenProps<
  T extends keyof RootStackParamList,
> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
