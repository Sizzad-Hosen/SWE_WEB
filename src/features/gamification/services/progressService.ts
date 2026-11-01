import { apiGet, apiPost } from '../../../config/api';
import {
  type ProgressSnapshot,
  useGamificationStore,
} from '../store/gamificationStore';

type SyncProgressResponse = {
  success: boolean;
  message?: string;
};

type GetProgressResponse = {
  success: boolean;
  progress: Partial<ProgressSnapshot>;
};

export const progressService = {
  async syncProgressToBackend() {
    const state = useGamificationStore.getState();

    const payload: ProgressSnapshot = {
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

    const result = await apiPost<SyncProgressResponse>('/progress/sync', payload, true);

    useGamificationStore.getState().setLastSyncAt(new Date().toISOString());

    return result;
  },

  async downloadProgressFromBackend() {
    const result = await apiGet<GetProgressResponse>('/progress/me', true);

    if (result.progress) {
      useGamificationStore.getState().replaceProgress(result.progress);
    }

    return result.progress;
  },
};