import { useEffect, useState } from 'react';
import { Calendar, MapPin, Volume2, VolumeX, Sparkles } from 'lucide-react';

export function InvitationPreview({ invitation }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());

  useEffect(() => {
    if (invitation.music_url) { audio.src = invitation.music_url; audio.loop = true; }
    return () => audio.pause();
  }, [invitation.music_url]);

  const toggleMusic = () => { isPlaying ? audio.pause() : audio.play(); setIsPlaying(!isPlaying); };

  const getEmojis = () => {
    switch (invitation.event_type) {
      case 'wedding': return ['❤️', '💍', '🥂'];
      case 'birthday': return ['🎂', '🎈', '🎉'];
      case 'party': return ['✨', '🥳', '💃'];
      case 'baptism': return ['👼', '✨', '🕊️'];
      case 'baby_shower': return ['🍼', '🧸', '👶'];
      case 'evjf_evg': return ['✝️', '🕊️'];
      default: return ['✨'];
    }
  };

  const getPaperClass = () => {
    switch(invitation.paper_type) {
      case 'parchment': return 'paper-parchment shadow-[inset_0_0_50px_rgba(0,0,0,0.15)]';
      case 'grainy': return 'paper-grainy';
      case 'cotton': return 'paper-cotton';
      default: return 'paper-smooth';
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-white shadow-2xl rounded-[3rem] overflow-hidden min-h-[800px] border-[8px] border-white">
      {/* Pluie d'emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute animate-fall" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, fontSize: '24px', top: '-50px' }}>
            {getEmojis()[i % getEmojis().length]}
          </div>
        ))}
      </div>

      {/* Musique */}
      {invitation.music_url && (
        <button onClick={toggleMusic} className="absolute top-6 right-6 z-50 p-4 bg-white/90 rounded-full shadow-xl text-amber-600 transition-transform active:scale-95">
          {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      )}

      {/* Photo principale */}
      <div className="h-[40vh] relative overflow-hidden">
        {invitation.main_photo_url ? (
          <img 
            src={invitation.main_photo_url} 
            className="w-full h-full object-cover" 
            style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} 
          />
        ) : ( <div className="w-full h-full bg-amber-50 flex items-center justify-center"><Sparkles className="text-amber-200" size={48} /></div> )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Carte de texte */}
      <div className="px-6 pb-12 -mt-16 relative z-10">
        <div className={`rounded-[2.5rem] p-8 shadow-xl border border-white/50 text-center space-y-6 transition-all duration-500 ${getPaperClass()}`}>
          <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: invitation.font_style || 'Inter' }}>
            {invitation.title || "Titre de l'événement"}
          </h1>
          <p className="opacity-70 italic font-medium">{invitation.host_names || "Hôtes"}</p>
          <div className="h-px bg-current opacity-10 w-full" />
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-1">
              <Calendar size={18} />
              <span className="text-sm font-bold uppercase tracking-widest">{invitation.event_date || "Date"}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MapPin size={18} />
              <span className="text-xs font-medium">{invitation.event_address || "Adresse"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}