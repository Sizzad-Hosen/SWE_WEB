import { useCallback, useEffect, useMemo, useState } from "react";

import { isSupabaseConfigured } from "../../../config/supabase";
import { env } from "../../../config/env";
import { getSubject } from "../data/curriculum";
import {
  getPublishedChapters,
  type ChapterListItem,
} from "../services/curriculumService";

export type ChapterPathItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  nextChapterId?: string;
};

export function useChapterPath(classId: number, subjectId: string) {
  const localSubject = useMemo(
    () => getSubject(classId, subjectId),
    [classId, subjectId],
  );

  const [remoteChapters, setRemoteChapters] = useState<ChapterListItem[]>([]);

  const [loading, setLoading] = useState(env.USE_REMOTE_CURRICULUM);

  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const localChapters = useMemo<ChapterPathItem[]>(
    () =>
      (localSubject?.chapters ?? []).map((chapter) => ({
        id: chapter.id,

        title: chapter.title,

        subtitle: chapter.subtitle,

        icon: chapter.icon,

        nextChapterId: chapter.nextChapterId,
      })),

    [localSubject],
  );

  const loadChapters = useCallback(async () => {
    if (!env.USE_REMOTE_CURRICULUM) {
      setRemoteChapters([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!isSupabaseConfigured) {
      setRemoteChapters([]);
      setLoading(false);
      setError(
        "এই build-এ Supabase URL অথবা public anon key configure করা নেই।",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chapters = await getPublishedChapters(classId, subjectId);
      setRemoteChapters(chapters);
    } catch (loadError: unknown) {
      setRemoteChapters([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "অনলাইন chapter list লোড করা যায়নি।",
      );
    } finally {
      setLoading(false);
    }
  }, [classId, subjectId]);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters, reloadKey]);

  const supabaseChapters = useMemo<ChapterPathItem[]>(
    () =>
      remoteChapters.map((chapter, index) => ({
        id: chapter.id,

        title: chapter.title_bn,

        subtitle: chapter.summary_bn ?? `পাঠ ${chapter.chapter_number}`,

        icon: chapter.chapter_number === 1 ? "⭐" : "📘",

        nextChapterId: remoteChapters[index + 1]?.id,
      })),

    [remoteChapters],
  );

  // Local lessons are available only when local mode is explicitly requested.
  // A release build must never hide a Supabase/RLS/configuration failure by
  // silently showing curriculum.ts content.
  const chapters = env.USE_REMOTE_CURRICULUM
    ? supabaseChapters
    : localChapters;
  const source = env.USE_REMOTE_CURRICULUM
    ? ("supabase" as const)
    : ("local" as const);

  return {
    subject: localSubject,

    chapters,

    loading,

    error,

    source,

    retry: () => setReloadKey((v) => v + 1),
  };
}
