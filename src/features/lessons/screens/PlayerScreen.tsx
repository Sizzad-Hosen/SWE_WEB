import React, { useState } from 'react';
import { useEvent, useEventListener } from '../../../web/expo';
import { VideoView, useVideoPlayer } from '../../../web/video';
import { Pressable, StyleSheet, Text, View } from '../../../web/dom';

import type { ScreenProps } from '../../../navigation/routes';
import { useGamificationStore } from '../../gamification/store/gamificationStore';

export default function PlayerScreen({ route, navigation }: ScreenProps<'Player'>) {
  const { chapterId, title, videoUrl, quizId, nextChapterId } = route.params;

  const [videoCompleted, setVideoCompleted] = useState(false);

  const markVideoWatched = useGamificationStore((state) => state.markVideoWatched);
  const watchedVideoIds = useGamificationStore((state) => state.watchedVideoIds);

  const alreadyWatched = watchedVideoIds.includes(chapterId);

  const player = useVideoPlayer(videoUrl, (playerInstance) => {
    playerInstance.loop = false;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const statusChange = useEvent(player, 'statusChange', {
    status: player.status,
    error: undefined,
  });
  const status = statusChange?.status;
  const error = statusChange?.error;

  useEventListener(player, 'playToEnd', () => {
    setVideoCompleted(true);
    markVideoWatched(chapterId);
  });

  const canStartQuiz = videoCompleted || alreadyWatched;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />

      {status === 'error' ? (
        <Text style={styles.errorText}>
          Video error: {error?.message ?? 'Could not play this video.'}
        </Text>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            if (isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
        >
          <Text style={styles.secondaryButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, !canStartQuiz && styles.disabledButton]}
          disabled={!canStartQuiz}
          onPress={() =>
            navigation.navigate('Quiz', {
              chapterId,
              quizId,
              nextChapterId,
            })
          }
        >
          <Text style={styles.primaryButtonText}>
            {canStartQuiz ? 'Start Quiz' : 'Finish video to unlock quiz'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.helperText}>
        Stars are given after passing the quiz, not only by watching the video.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
  },
  video: {
    width: '100%',
    height: 230,
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  controls: {
    marginTop: 16,
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2563EB',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  helperText: {
    marginTop: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#DC2626',
  },
});
