import { useEffect, useRef, useState } from 'react';

const tracks = ['/music/dehors.mp3', '/music/arigatou.mp3'];

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * tracks.length));

  useEffect(() => {
    void audioRef.current?.play().catch(() => undefined);
  }, [trackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const startAfterInteraction = () => {
      void audio.play().catch(() => undefined);
      document.removeEventListener('pointerdown', startAfterInteraction);
      document.removeEventListener('keydown', startAfterInteraction);
    };

    document.addEventListener('pointerdown', startAfterInteraction, { once: true });
    document.addEventListener('keydown', startAfterInteraction, { once: true });
    return () => {
      document.removeEventListener('pointerdown', startAfterInteraction);
      document.removeEventListener('keydown', startAfterInteraction);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src={tracks[trackIndex]}
      preload="auto"
      aria-hidden="true"
      onEnded={() => setTrackIndex((index) => (index + 1) % tracks.length)}
    />
  );
}
