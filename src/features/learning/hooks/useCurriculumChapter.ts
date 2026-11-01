import { useEffect, useMemo, useState } from 'react';

import { isSupabaseConfigured } from '../../../config/supabase';
import { env } from '../../../config/env';
import { getChapter, type CurriculumChapter } from '../data/curriculum';
import { adaptSupabaseChapter } from '../services/supabaseCurriculumAdapter';
import {
  getCurriculumChapter,
  getPublishedChapters,
} from '../services/curriculumService';

export function useCurriculumChapter(chapterId: string) {
  const localChapter = useMemo(
    () => getChapter(chapterId)?.chapter ?? null,
    [chapterId]
  );

  const [remoteChapter, setRemoteChapter] = useState<CurriculumChapter | null>(null);
  const [loading, setLoading] = useState(env.USE_REMOTE_CURRICULUM);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    if (!env.USE_REMOTE_CURRICULUM) {
      setRemoteChapter(null);
      setLoading(false);
      setError(null);

      return () => {
        active = false;
      };
    }

    if (!isSupabaseConfigured) {
      setRemoteChapter(null);
      setLoading(false);
      setError(
        'এই build-এ Supabase URL অথবা public anon key configure করা নেই।'
      );
      return () => {
        active = false;
      };
    }

    setRemoteChapter(null);
    setLoading(true);
    setError(null);

    void getCurriculumChapter(chapterId)
      .then(async (chapter) => {
        if (!active) return;

        if (!chapter) {
          setError('পাঠটি এখনো প্রকাশ করা হয়নি অথবা পাওয়া যায়নি।');
          return;
        }

        const publishedChapters = await getPublishedChapters(
          chapter.class_level,
          chapter.subject_id
        );
        const chapterIndex = publishedChapters.findIndex(
          (item) => item.id === chapter.id
        );
        const nextChapterId =
          chapterIndex >= 0
            ? publishedChapters[chapterIndex + 1]?.id
            : undefined;

        if (!active) return;

        setRemoteChapter(adaptSupabaseChapter(chapter, { nextChapterId }));
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'পাঠটি লোড করা যায়নি।'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [chapterId, localChapter, reloadKey]);

  return {
    chapter: env.USE_REMOTE_CURRICULUM
      ? remoteChapter
      : localChapter,
    loading,
    error,
    retry: () => setReloadKey((value) => value + 1),
    source: env.USE_REMOTE_CURRICULUM
      ? ('supabase' as const)
      : ('local' as const),
  };
}
