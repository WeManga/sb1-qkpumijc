import { useEffect, useState } from 'react';
import { translations, Language } from '../../lib/i18n';
import { 
  Calendar, MapPin, Clock, Music2, Volume2, VolumeX, 
  Heart, PartyPopper, Sparkles, Baby, Church 
} from 'lucide-react';

export function InvitationPreview({ invitation }: any) {
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

  // Logique de la pluie d'emojis
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
    <div className="relative w-full max-w-md mx-auto bg-white shadow-2xl rounded-[3rem] overflow-hidden min-h-[800px] border-[8px] border-white">
      {/* Pluie d'emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        {[...Array(12)].map((_, i) => (
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
          className="absolute top-6 right-6 z-50 p-4 bg-white/90 backdrop-blur-xl rounded-full shadow-xl hover:scale-110 transition-transform text-amber-600"
        >
          {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      )}

      {/* Image de fond */}
      <div className="h-[45vh] relative overflow-hidden">
        {invitation.main_photo_url ? (
          <img 
            src={invitation.main_photo_url} 
            className="w-full h-full object-cover"
            style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-amber-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Contenu */}
      <div className="px-8 pb-12 -mt-20 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight" style={{ fontFamily: invitation.font_style || 'Inter' }}>
            {invitation.title || t.default_title}
          </h1>
          
          <p className="text-gray-500 font-medium italic tracking-wide">
            {invitation.host_names || t.default_hosts}
          </p>

          <div className="h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent w-full" />

          <div className="grid grid-cols-1 gap-4 py-2">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <Calendar size={20} />
              </div>
              <span className="text-sm font-bold text-gray-800">
                {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : t.default_date}
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <MapPin size={20} />
              </div>
              <span className="text-sm font-medium text-gray-600 px-4">
                {invitation.event_address || t.default_address}
              </span>
            </div>
          </div>
        </div>

        {/* Programme */}
        {invitation.event_program && invitation.event_program.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 text-center mb-6">{t.program_title}</h3>
            <div className="space-y-3">
              {invitation.event_program.map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-white shadow-sm">
                  <div className="px-3 py-1 bg-white rounded-xl text-xs font-black text-amber-600 shadow-sm border border-amber-50">
                    {step.time}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{step.activity}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}