import { useState } from 'react';
import { progressService } from '../services/progressService';

export function useProgressSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncNow = async () => {
    setSyncing(true);
    setError(null);

    try {
      await progressService.syncProgressToBackend();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Progress sync failed.';
      setError(message);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const downloadCloudProgress = async () => {
    setSyncing(true);
    setError(null);

    try {
      await progressService.downloadProgressFromBackend();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not download cloud progress.';
      setError(message);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    error,
    syncNow,
    downloadCloudProgress,
  };
}