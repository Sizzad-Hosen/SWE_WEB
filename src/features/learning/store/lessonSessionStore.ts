import AsyncStorage from "../../../web/async-storage";
import { create } from "zustand";

const STORAGE_KEY =
  "nctb_kids_lesson_sessions_v1";

export type LessonSession = {
  chapterId: string;
  step: number;
  startedAt: string;
  updatedAt: string;
  completedActivityIds: string[];
  attemptsByActivity: Record<string, number>;
};

type LessonSessionStore = {
  sessions: Record<string, LessonSession>;
  loadSessions: () => Promise<void>;
  startOrResume: (
    chapterId: string,
  ) => LessonSession;
  setStep: (
    chapterId: string,
    step: number,
  ) => void;
  markActivityComplete: (
    chapterId: string,
    activityId: string,
  ) => void;
  recordAttempt: (
    chapterId: string,
    activityId: string,
  ) => void;
  clearSession: (chapterId: string) => void;
  resetAllSessions: () => Promise<void>;
};

function createSession(
  chapterId: string,
): LessonSession {
  const now = new Date().toISOString();

  return {
    chapterId,
    step: 0,
    startedAt: now,
    updatedAt: now,
    completedActivityIds: [],
    attemptsByActivity: {},
  };
}

async function persist(
  sessions: Record<string, LessonSession>,
) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sessions),
  );
}

export const useLessonSessionStore =
  create<LessonSessionStore>((set, get) => ({
    sessions: {},

    loadSessions: async () => {
      const raw =
        await AsyncStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return;
      }

      try {
        const parsed = JSON.parse(raw) as Record<
          string,
          LessonSession
        >;

        set({
          sessions:
            parsed &&
            typeof parsed === "object"
              ? parsed
              : {},
        });
      } catch {
        await AsyncStorage.removeItem(
          STORAGE_KEY,
        );
        set({ sessions: {} });
      }
    },

    startOrResume: (chapterId) => {
      const existing =
        get().sessions[chapterId];

      if (existing) {
        return existing;
      }

      const session =
        createSession(chapterId);

      const sessions = {
        ...get().sessions,
        [chapterId]: session,
      };

      set({ sessions });
      void persist(sessions);

      return session;
    },

    setStep: (chapterId, step) => {
      const current =
        get().sessions[chapterId] ??
        createSession(chapterId);

      const sessions = {
        ...get().sessions,
        [chapterId]: {
          ...current,
          step: Math.max(0, step),
          updatedAt:
            new Date().toISOString(),
        },
      };

      set({ sessions });
      void persist(sessions);
    },

    markActivityComplete: (
      chapterId,
      activityId,
    ) => {
      const current =
        get().sessions[chapterId] ??
        createSession(chapterId);

      if (
        current.completedActivityIds.includes(
          activityId,
        )
      ) {
        return;
      }

      const sessions = {
        ...get().sessions,
        [chapterId]: {
          ...current,
          completedActivityIds: [
            ...current.completedActivityIds,
            activityId,
          ],
          updatedAt:
            new Date().toISOString(),
        },
      };

      set({ sessions });
      void persist(sessions);
    },

    recordAttempt: (
      chapterId,
      activityId,
    ) => {
      const current =
        get().sessions[chapterId] ??
        createSession(chapterId);

      const sessions = {
        ...get().sessions,
        [chapterId]: {
          ...current,
          attemptsByActivity: {
            ...current.attemptsByActivity,
            [activityId]:
              (current.attemptsByActivity[
                activityId
              ] ?? 0) + 1,
          },
          updatedAt:
            new Date().toISOString(),
        },
      };

      set({ sessions });
      void persist(sessions);
    },

    clearSession: (chapterId) => {
      const sessions = {
        ...get().sessions,
      };

      delete sessions[chapterId];

      set({ sessions });
      void persist(sessions);
    },

    resetAllSessions: async () => {
      set({ sessions: {} });
      await AsyncStorage.removeItem(
        STORAGE_KEY,
      );
    },
  }));
