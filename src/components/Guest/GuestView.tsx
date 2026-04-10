import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { Calendar, MapPin, Music2, Volume2, VolumeX, Sparkles } from 'lucide-react';

export function GuestView({ invitation }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  const [lang] = useState<Language>((localStorage.getItem('invite_lang') as Language) || 'fr');
  const t = translations[lang].preview;

  useEffect(() => {
    if (invitation.music_url) {
      audio.src = invitation.music_url;
      audio.loop = true;
    }
  }, [invitation.music_url]);

  const toggleMusic = () => {
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  // Logique de la pluie d'emojis identique à la preview
  const getEmojis = () => {
    switch (invitation.event_type) {
      case 'wedding': return ['❤️', '💍', '🥂'];
      case 'birthday': return ['🎂', '🎈', '🎉'];
      case 'party': return ['✨', '🥳', '💃'];
      case 'baptism': return ['👼', '✨', '🕊️'];
      case 'baby_shower': return ['🍼', '🧸', '👶'];
      case 'evjf_evg': return ['✝️', '🕊️']; // Enterrements : Croix et Colombes
      default: return ['✨'];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white shadow-2xl rounded-[3rem] overflow-hidden min-h-[85vh] border-[8px] border-white">
        
        {/* Effet d'animation de pluie */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: '24px',
                top: '-50px'
              }}
            >
              {getEmojis()[i % getEmojis().length]}
            </div>
          ))}
        </div>

        {/* Musique */}
        {invitation.music_url && (
          <button 
            onClick={toggleMusic}
            className="absolute top-6 right-6 z-50 p-4 bg-white/90 backdrop-blur-xl rounded-full shadow-xl text-amber-600"
          >
            {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        )}

        {/* Header Photo */}
        <div className="h-[45vh] relative overflow-hidden">
          {invitation.main_photo_url ? (
            <img 
              src={invitation.main_photo_url} 
              className="w-full h-full object-cover"
              style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }}
            />
          ) : (
            <div className="w-full h-full bg-amber-50 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-amber-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="px-8 pb-12 -mt-20 relative z-10 text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white space-y-6">
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: invitation.font_style || 'Inter' }}>
              {invitation.title}
            </h1>
            <p className="text-gray-500 italic font-medium">{invitation.host_names}</p>
            
            <div className="h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent w-full" />

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <Calendar className="text-amber-500" size={24} />
                <span className="font-bold text-gray-800">
                  {new Date(invitation.event_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MapPin className="text-amber-500" size={24} />
                <span className="text-sm font-medium text-gray-600">{invitation.event_address}</span>
              </div>
            </div>
          </div>

          {/* Programme affiché pour les invités */}
          {invitation.event_program && invitation.event_program.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="space-y-3">
                {invitation.event_program.map((step: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="px-3 py-1 bg-amber-50 rounded-xl text-xs font-black text-amber-600 border border-amber-100">
                      {step.time}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">{step.activity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-12 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
            Créé avec Love
          </div>
        </div>
      </div>
    </div>
  );
}