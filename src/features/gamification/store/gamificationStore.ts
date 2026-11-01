import AsyncStorage from '../../../web/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'nctb_kids_local_progress_v1';

export type CompletedChapterInfo = {
  starsEarned: number;
  quizScore: number;
  completedAt: string;
};

export type ProgressSnapshot = {
  stars: number;
  weeklyStars: number;
  level: number;
  streak: number;
  badges: string[];
  unlockedChapterIds: string[];
  watchedVideoIds: string[];
  completedChapters: Record<string, CompletedChapterInfo>;
  lastSyncAt: string | null;
};

type CompleteChapterPayload = {
  chapterId: string;
  nextChapterId?: string;
  starsEarned: number;
  quizScore: number;
};

type GamificationStore = ProgressSnapshot & {
  loadLocalProgress: () => Promise<void>;
  saveProgress: () => Promise<void>;
  replaceProgress: (progress: Partial<ProgressSnapshot>) => void;
  markVideoWatched: (chapterId: string) => void;
  unlockChapter: (chapterId: string) => void;
  completeChapter: (payload: CompleteChapterPayload) => boolean;
  addBadge: (badgeId: string) => void;
  setLastSyncAt: (value: string) => void;
  resetLocalProgress: () => Promise<void>;
};

const initialProgress: ProgressSnapshot = {
  stars: 0,
  weeklyStars: 0,
  level: 1,
  streak: 0,
  badges: [],
  unlockedChapterIds: [],
  watchedVideoIds: [],
  completedChapters: {},
  lastSyncAt: null,
};

const calculateLevel = (stars: number) => Math.floor(stars / 100) + 1;

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  ...initialProgress,

  loadLocalProgress: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ProgressSnapshot>;
      set({
        ...initialProgress,
        ...parsed,
        level: calculateLevel(typeof parsed.stars === 'number' ? parsed.stars : 0),
      });
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set(initialProgress);
    }
  },

  saveProgress: async () => {
    const state = get();

    const snapshot: ProgressSnapshot = {
      stars: state.stars,
      weeklyStars: state.weeklyStars,
      level: state.level,
      streak: state.streak,
      badges: state.badges,
      unlockedChapterIds: state.unlockedChapterIds,
      watchedVideoIds: state.watchedVideoIds,
      completedChapters: state.completedChapters,
      lastSyncAt: state.lastSyncAt,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  },

  replaceProgress: (progress) => {
    set((state) => ({
      ...state,
      ...progress,
      level: calculateLevel(progress.stars ?? state.stars),
    }));

    void get().saveProgress();
  },

  markVideoWatched: (chapterId) => {
    const state = get();

    if (state.watchedVideoIds.includes(chapterId)) {
      return;
    }

    set({
      watchedVideoIds: [...state.watchedVideoIds, chapterId],
    });

    void get().saveProgress();
  },

  unlockChapter: (chapterId) => {
    const state = get();

    if (state.unlockedChapterIds.includes(chapterId)) {
      return;
    }

    set({
      unlockedChapterIds: [...state.unlockedChapterIds, chapterId],
    });

    void get().saveProgress();
  },

  completeChapter: ({ chapterId, nextChapterId, starsEarned, quizScore }) => {
    const state = get();

    if (state.completedChapters[chapterId]) {
      return false;
    }

    const newStars = state.stars + starsEarned;
    const newWeeklyStars = state.weeklyStars + starsEarned;

    const nextUnlockedChapterIds = nextChapterId
      ? [...new Set([...state.unlockedChapterIds, nextChapterId])]
      : state.unlockedChapterIds;

    const nextBadges = [...state.badges];

    if (Object.keys(state.completedChapters).length === 0 && !nextBadges.includes('first_chapter')) {
      nextBadges.push('first_chapter');
    }

    if (newStars >= 100 && !nextBadges.includes('star_collector_100')) {
      nextBadges.push('star_collector_100');
    }

    set({
      stars: newStars,
      weeklyStars: newWeeklyStars,
      level: calculateLevel(newStars),
      badges: nextBadges,
      unlockedChapterIds: nextUnlockedChapterIds,
      completedChapters: {
        ...state.completedChapters,
        [chapterId]: {
          starsEarned,
          quizScore,
          completedAt: new Date().toISOString(),
        },
      },
    });

    void get().saveProgress();
    return true;
  },

  addBadge: (badgeId) => {
    const state = get();

    if (state.badges.includes(badgeId)) {
      return;
    }

    set({
      badges: [...state.badges, badgeId],
    });

    void get().saveProgress();
  },

  setLastSyncAt: (value) => {
    set({
      lastSyncAt: value,
    });

    void get().saveProgress();
  },

  resetLocalProgress: async () => {
    set(initialProgress);
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
