type SpeechOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: unknown) => void;
};

export function speak(text: string, options: SpeechOptions = {}) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.language ?? 'bn-BD';
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;
  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onDone) utterance.onend = options.onDone;
  if (options.onError) utterance.onerror = options.onError;
  window.speechSynthesis.speak(utterance);
}

export function stop() { window.speechSynthesis?.cancel(); }
export async function isSpeakingAsync() { return window.speechSynthesis?.speaking ?? false; }
