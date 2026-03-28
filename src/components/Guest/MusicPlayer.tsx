import { useEffect, useRef } from 'react';

export function MusicPlayer({ musicUrl }: { musicUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && musicUrl) {
      audioRef.current.volume = 0;
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          let vol = 0;
          const interval = setInterval(() => {
            if (vol < 0.4) {
              vol += 0.05;
              if (audioRef.current) audioRef.current.volume = vol;
            } else {
              clearInterval(interval);
            }
          }, 150);
        }).catch(e => console.log("Audio en attente d'interaction"));
      }
    }
  }, [musicUrl]);

  return (
    <audio 
      ref={audioRef} 
      src={musicUrl} 
      loop 
      playsInline 
      className="hidden" 
    />
  );
}