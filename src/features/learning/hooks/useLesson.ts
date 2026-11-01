import {useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';
export type Activity = {
  id: string;
  chapter_id: string;
  order_index: number;
  activity_type: string;
  title_bn: string;
  instruction_bn?: string;
  payload: any;
};

export function useLesson(chapterId: string) {
  const [chapter, setChapter] = useState<{ id: string; title: string; activities: Activity[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const { data: activities, error: actError } = await supabase
          .from('lesson_activities')
          .select('*')
          .eq('chapter_id', chapterId)
          .eq('status', 'published')
          .order('order_index');

        if (actError) throw actError;

        // Map local type → Supabase enum-compatible
        const mappedActivities: Activity[] = activities.map((a: any) => {
          let type = a.activity_type;
          if (type === 'tap') type = 'matching';
          if (type === 'snippet') type = 'story_snippet';
          if (type === 'textbook') type = 'image_lesson';
          if (type === 'voice') type = 'audio_lesson';
          return { ...a, activity_type: type, payload: a.payload };
        });

        setChapter({
          id: chapterId,
          title: 'Chapter', // replace with real chapter title from Supabase if needed
          activities: mappedActivities
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [chapterId]);

  return { chapter, loading, error };
}