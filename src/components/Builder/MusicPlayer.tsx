import { useEffect, useRef } from 'react';

interface MusicPlayerProps {
  musicUrl: string;
}

export function MusicPlayer({ musicUrl }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicUrl) return;

    // Gestion du volume progressif (Fade-in) pour éviter le choc sonore
    audio.volume = 0;
    
    const playAudio = async () => {
      try {
        await audio.play();
        // Monter le volume doucement
        let vol = 0;
        const interval = setInterval(() => {
          if (vol < 0.4) {
            vol += 0.05;
            audio.volume = Math.min(vol, 0.4);
          } else {
            clearInterval(interval);
          }
        }, 200);
      } catch (err) {
        console.log("Lecture bloquée : l'utilisateur doit interagir avec la page d'abord.");
      }
    };

    playAudio();

    return () => {
      audio.pause();
    };
  }, [musicUrl]); // Ne redémarre que si l'URL change

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