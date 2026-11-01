import React, { useState } from 'react';
import { useEventListener } from '../../../web/expo';
import { StyleSheet, Text, View } from '../../../web/dom';
import { VideoView, useVideoPlayer } from '../../../web/video';

import { colors } from '../../../theme/theme';

type VideoActivityProps = {
  title: string;
  url: string;
  completed: boolean;
  onComplete: () => void;
};

export function VideoActivity({
  title,
  url,
  completed,
  onComplete,
}: VideoActivityProps) {
  const [watchedToEnd, setWatchedToEnd] = useState(completed);

  const player = useVideoPlayer(url, (instance) => {
    instance.loop = false;
  });

  useEventListener(player, 'playToEnd', () => {
    setWatchedToEnd(true);
    onComplete();
  });

  return (
    <View>
      <Text style={styles.title}>{title}</Text>

      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />

      <Text style={watchedToEnd ? styles.completedText : styles.help}>
        {watchedToEnd
          ? '✓ ভিডিওটি সম্পূর্ণ দেখা হয়েছে। এখন পরের শেখার কাজে যাও।'
          : 'ভিডিওটি শেষ পর্যন্ত দেখলে পরের শেখার কাজ খুলবে।'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 14,
  },
  video: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#000',
  },
  help: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 20,
  },
  completedText: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.greenDark,
    fontWeight: '900',
    lineHeight: 20,
  },
});
