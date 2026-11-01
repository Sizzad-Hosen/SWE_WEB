import { supabase } from '../../../config/supabase';

export type LeaderboardProfile = {
  user_id: string;
  display_name: string;
  class_level: number;
  total_stars: number;
  weekly_stars: number;
  chapters_completed: number;
  badge_count: number;
  last_updated: string;
};

export const leaderboardService = {
  async getTopLeaderboard(limit = 30) {
    const { data, error } = await supabase
      .from('leaderboard_profiles')
      .select(
        'user_id, display_name, class_level, total_stars, weekly_stars, chapters_completed, badge_count, last_updated'
      )
      .order('total_stars', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as LeaderboardProfile[];
  },

  subscribeToLeaderboard(onChange: () => void) {
    const channel = supabase
      .channel('leaderboard_profiles_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_profiles',
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};