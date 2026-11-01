import { useEffect, useState } from 'react';
import {
  leaderboardService,
  type LeaderboardProfile,
} from '../services/leaderboardService';

export function useLeaderboard() {
  const [users, setUsers] = useState<LeaderboardProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    setError(null);

    try {
      const data = await leaderboardService.getTopLeaderboard(30);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaderboard();

    const unsubscribe = leaderboardService.subscribeToLeaderboard(() => {
      void loadLeaderboard();
    });

    return unsubscribe;
  }, []);

  return {
    users,
    loading,
    error,
    reload: loadLeaderboard,
  };
}