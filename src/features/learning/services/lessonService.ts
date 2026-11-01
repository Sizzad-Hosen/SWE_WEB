import { supabase } from '../../../config/supabase';

export const lessonService = {
  async getChapterActivities(chapterId: string) {
    const { data, error } = await supabase
      .from('lesson_activities')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('status', 'published')
      .order('order_index');
    if (error) throw error;
    return data;
  },

  async getChapterQuiz(chapterId: string) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(`*, quiz_options(*)`)
      .eq('chapter_id', chapterId)
      .eq('status', 'published')
      .order('order_index');
    if (error) throw error;
    return data ?? [];
  }
};