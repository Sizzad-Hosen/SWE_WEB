import React, { useMemo, useRef } from 'react';

type Player = {
  source: string;
  loop: boolean;
  play: () => void;
  pause: () => void;
  _element: HTMLVideoElement | null;
  playing: boolean;
  status: string;
  addEventListener: (name: string, listener: EventListener) => void;
  removeEventListener: (name: string, listener: EventListener) => void;
};

export function useVideoPlayer(source: string | { uri?: string }, setup?: (player: Player) => void): any {
  return useMemo(() => {
    const player: Player = {
      source: typeof source === 'string' ? source : source?.uri ?? '',
      loop: false,
      _element: null,
      playing: false,
      status: 'idle',
      play: () => { player.playing = true; player.status = 'readyToPlay'; void player._element?.play(); },
      pause: () => { player.playing = false; player._element?.pause(); },
      addEventListener: (name, listener) => player._element?.addEventListener(name, listener),
      removeEventListener: (name, listener) => player._element?.removeEventListener(name, listener),
    };
    setup?.(player);
    return player;
  }, [typeof source === 'string' ? source : source?.uri]);
}

export function VideoView({ player, style, nativeControls = true }: any) {
  return (
    <video
      ref={(element) => { player._element = element; if (element) element.loop = player.loop; }}
      src={player.source}
      controls={nativeControls}
      style={style}
      playsInline
    />
  );
}
