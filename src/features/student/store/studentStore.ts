import AsyncStorage from "../../../web/async-storage";
import { create } from "zustand";

import { isSupabaseConfigured } from "../../../config/supabase";
import { useGamificationStore } from "../../gamification/store/gamificationStore";
import { useLessonSessionStore } from "../../learning/store/lessonSessionStore";
import { parentService } from "../../parent/services/parentService";
import { progressService } from "../../learning/services/progressService";
import {
  studentService,
  type StudentRow,
} from "../services/studentService";

const STORAGE_KEY = "nctb_student_v2";

export type StudentProfile = {
  id: string;
  studentCode: string;
  classLevel: number;
  nickname: string;
  avatar: string;
  parentLinked: boolean;
  accountType: "guest" | "parent";
  totalPoints: number;
  recoveryCode: string | null;
  recoveryAcknowledged: boolean;
};

type StudentStore = {
  student: StudentProfile | null;
  createStudent: (
    classLevel: number,
  ) => Promise<StudentProfile>;
  loadStudent: () => Promise<void>;
  restoreStudent: (
    studentCode: string,
    recoveryCode: string,
  ) => Promise<StudentProfile>;
  restoreLinkedChild: (
    studentId: string,
  ) => Promise<StudentProfile>;
  acknowledgeRecovery: () => Promise<void>;
  linkParent: () => Promise<void>;
  clearStudent: () => Promise<void>;
};

function validStudent(
  value: unknown,
): value is StudentProfile {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const item =
    value as Partial<StudentProfile>;

  return (
    typeof item.id === "string" &&
    typeof item.studentCode === "string" &&
    Number.isInteger(item.classLevel) &&
    Number(item.classLevel) >= 1 &&
    Number(item.classLevel) <= 3
  );
}

function avatarFromKey(
  avatarKey: string,
) {
  if (avatarKey === "tiger-1") {
    return "🐯";
  }

  if (avatarKey === "lion-1") {
    return "🦁";
  }

  return "🐼";
}

function mapStudentRow(
  row: StudentRow,
  parentLinked: boolean,
  recoveryAcknowledged: boolean,
): StudentProfile {
  return {
    id: row.id,
    studentCode: row.student_code,
    classLevel: row.class_level,
    nickname: row.display_name,
    avatar: avatarFromKey(
      row.avatar_key,
    ),
    parentLinked,
    accountType: parentLinked
      ? "parent"
      : "guest",
    totalPoints: row.total_points,
    recoveryCode: row.recovery_code,
    recoveryAcknowledged:
      !row.recovery_code ||
      recoveryAcknowledged,
  };
}

function createLocalStudent(
  classLevel: number,
): StudentProfile {
  const random = Math.floor(
    10000 + Math.random() * 90000,
  );

  return {
    id:
      `local-${Date.now()}-${random}`,
    studentCode:
      `NCTB-C${classLevel}-${random}`,
    classLevel,
    nickname: "তুমি",
    avatar: "🐯",
    parentLinked: false,
    accountType: "guest",
    totalPoints: 0,
    recoveryCode: null,
    recoveryAcknowledged: true,
  };
}

async function saveStudent(
  profile: StudentProfile,
) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(profile),
  );
}

async function readCachedStudent():
  Promise<StudentProfile | null> {
  const raw =
    await AsyncStorage.getItem(
      STORAGE_KEY,
    );

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown =
      JSON.parse(raw);

    if (!validStudent(parsed)) {
      await AsyncStorage.removeItem(
        STORAGE_KEY,
      );
      return null;
    }

    return {
      ...parsed,
      nickname:
        parsed.nickname ?? "তুমি",
      avatar:
        parsed.avatar ?? "🐯",
      parentLinked:
        parsed.parentLinked ?? false,
      accountType:
        parsed.accountType ?? "guest",
      totalPoints:
        parsed.totalPoints ?? 0,
      recoveryCode:
        parsed.recoveryCode ?? null,
      recoveryAcknowledged:
        parsed.recoveryAcknowledged ??
        parsed.id.startsWith("local-"),
    };
  } catch {
    await AsyncStorage.removeItem(
      STORAGE_KEY,
    );
    return null;
  }
}

async function resetLocalLearningState() {
  await Promise.all([
    useGamificationStore
      .getState()
      .resetLocalProgress(),
    useLessonSessionStore
      .getState()
      .resetAllSessions(),
  ]);
}

async function saveRecoveredProgress(
  row: StudentRow,
) {
  const localState =
    useGamificationStore.getState();

  const localCompletedChapterIds =
    Object.keys(
      localState.completedChapters,
    );

  // Recovery-এর আগে local completed chapters
  // Supabase-এ upload করার চেষ্টা করবে।
  for (const chapterId of localCompletedChapterIds) {
    try {
      await progressService.completeChapter(
        row.id,
        chapterId,
      );
    } catch (syncError) {
      console.warn(
        `Recovery progress upload failed for chapter ${chapterId}`,
        syncError,
      );
    }
  }

  const cloudProgress =
    await studentService.getRecoveryProgress(
      row.id,
      row.class_level,
    );

  const cloudHasProgress =
    Object.keys(
      cloudProgress.completedChapters,
    ).length > 0 ||
    cloudProgress.stars > 0;

  const localHasProgress =
    localCompletedChapterIds.length > 0 ||
    localState.stars > 0;

  // Cloud empty কিন্তু local progress থাকলে
  // local progress delete করবে না।
  if (
    !cloudHasProgress &&
    localHasProgress
  ) {
    console.warn(
      "Cloud progress is empty. Local child progress was preserved.",
    );
    return;
  }

  await resetLocalLearningState();

  useGamificationStore
    .getState()
    .replaceProgress(cloudProgress);

  await useGamificationStore
    .getState()
    .saveProgress();
}

export const useStudentStore =
  create<StudentStore>(
    (set, get) => ({
      student: null,

      createStudent: async (
        classLevel,
      ) => {
        const existing =
          get().student;

        if (existing) {
          return existing;
        }

        let profile: StudentProfile;

        if (isSupabaseConfigured) {
          const user =
            await studentService
              .ensureSession();

          const existingStudent =
            await studentService
              .findChildDeviceStudent(
                user.id,
              );

          if (existingStudent) {
            const parentLinked =
              await studentService
                .hasParentLink(
                  existingStudent.id,
                );

            profile = mapStudentRow(
              existingStudent,
              parentLinked,
              false,
            );
          } else {
            const row =
              await studentService
                .createStudent(
                  classLevel,
                );

            profile = mapStudentRow(
              row,
              false,
              false,
            );
          }
        } else {
          profile =
            createLocalStudent(
              classLevel,
            );
        }

        await saveStudent(profile);
        set({ student: profile });

        return profile;
      },

      loadStudent: async () => {
        const cached =
          await readCachedStudent();

        if (cached) {
          set({ student: cached });
        }

        if (
          !isSupabaseConfigured ||
          cached?.id.startsWith(
            "local-",
          )
        ) {
          return;
        }

        try {
          const user =
            await studentService
              .ensureSession();

          let row = cached
            ? await studentService
                .getStudent(cached.id)
            : null;

          if (!row) {
            row =
              await studentService
                .findChildDeviceStudent(
                  user.id,
                );
          }

          if (!row) {
            await AsyncStorage.removeItem(
              STORAGE_KEY,
            );
            set({ student: null });
            return;
          }

          const parentLinked =
            await studentService
              .hasParentLink(row.id);

          const profile =
            mapStudentRow(
              row,
              parentLinked,
              cached
                ?.recoveryAcknowledged ??
                false,
            );

          await saveStudent(profile);
          set({ student: profile });
        } catch (error) {
          if (cached) {
            console.warn(
              "Cloud student refresh failed; using cached profile.",
              error,
            );
            return;
          }

          await AsyncStorage.removeItem(
            STORAGE_KEY,
          );
          set({ student: null });
          throw error;
        }
      },

      restoreStudent: async (
        studentCode,
        recoveryCode,
      ) => {
        if (!isSupabaseConfigured) {
          throw new Error(
            "Cloud sync is not configured.",
          );
        }

        const row =
          await studentService
            .restoreStudent(
              studentCode,
              recoveryCode,
            );

        const parentLinked =
          await studentService
            .hasParentLink(row.id);

        await saveRecoveredProgress(
          row,
        );

        const profile =
          mapStudentRow(
            row,
            parentLinked,
            true,
          );

        await saveStudent(profile);

        set({ student: profile });

        return profile;
      },

      restoreLinkedChild: async (
        studentId,
      ) => {
        if (!isSupabaseConfigured) {
          throw new Error(
            "Cloud sync is not configured.",
          );
        }

        const childUser =
          await studentService
            .ensureSession();

        await parentService
          .recoverLinkedChild(
            studentId,
            childUser.id,
          );

        const row =
          await studentService
            .getStudent(studentId);

        if (!row) {
          throw new Error(
            "Recovered child profile could not be loaded.",
          );
        }

        await saveRecoveredProgress(
          row,
        );

        const profile =
          mapStudentRow(
            row,
            true,
            true,
          );

        await saveStudent(profile);

        set({ student: profile });

        return profile;
      },

      acknowledgeRecovery:
        async () => {
          const student =
            get().student;

          if (!student) {
            return;
          }

          const next: StudentProfile = {
            ...student,
            recoveryAcknowledged:
              true,
          };

          await saveStudent(next);
          set({ student: next });
        },

      linkParent: async () => {
        const student =
          get().student;

        if (!student) {
          return;
        }

        const [parentLinked, latestRow] =
          await Promise.all([
            studentService.hasParentLink(
              student.id,
            ),
            student.id.startsWith("local-")
              ? Promise.resolve(null)
              : studentService.getStudent(
                  student.id,
                ),
          ]);

        const next: StudentProfile = {
          ...student,
          nickname:
            latestRow?.display_name ??
            student.nickname,
          parentLinked,
          accountType:
            parentLinked
              ? "parent"
              : "guest",
        };

        await saveStudent(next);
        set({ student: next });
      },

      clearStudent: async () => {
        await Promise.all([
          AsyncStorage.removeItem(
            STORAGE_KEY,
          ),
          resetLocalLearningState(),
        ]);

        set({ student: null });
      },
    }),
  );
