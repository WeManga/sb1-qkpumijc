import { useEffect, useState } from 'react';
import { Calendar, MapPin, Volume2, VolumeX, Sparkles } from 'lucide-react';

export function GuestView({ invitation }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());

  useEffect(() => {
    if (invitation.music_url) { audio.src = invitation.music_url; audio.loop = true; }
    return () => audio.pause();
  }, [invitation.music_url]);

  const getEmojis = () => {
    switch (invitation.event_type) {
      case 'wedding': return ['🤍', '💍', '🕊️', '✨', '🌸'];
      case 'birthday': return ['🎂', '🎈', '✨', '🎉', '🍰'];
      case 'party': return ['✨', '🎸', '🥂', '🕺', '🌟'];
      case 'baptism': return ['👼', '☁️', '🤍', '✨', '🕊️'];
      case 'babyshower': return ['🍼', '🤍', '👶', '💖', '💙'];
      case 'funeral': return ['🙏', '🕊️', '🥀', '⚰️', '🤍'];
      default: return ['✨', '🌟', '🤍'];
    }
  };

  const getPaperClass = () => {
    switch(invitation.paper_type) {
      case 'parchment': return 'paper-parchment shadow-[inset_0_0_60px_rgba(0,0,0,0.2)]';
      case 'grainy': return 'paper-grainy';
      case 'cotton': return 'paper-cotton';
      default: return 'paper-smooth shadow-xl';
    }
  };

  return (
    /* MISE À JOUR : Fond dynamique basé sur la couleur choisie dans la Sidebar */
    <div 
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden transition-colors duration-500" 
      style={{ backgroundColor: invitation.envelope_color || '#F3F4F6' }}
    >
      {/* Pluie d'emojis */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute animate-fall" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, fontSize: '28px', top: '-50px' }}>
            {getEmojis()[i % getEmojis().length]}
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-md bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border-[10px] border-white">
        {invitation.music_url && (
          <button onClick={() => { isPlaying ? audio.pause() : audio.play(); setIsPlaying(!isPlaying); }} className="absolute top-6 right-6 z-50 p-4 bg-white/80 rounded-full shadow-lg text-amber-600">
            {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        )}

        <div className="h-[45vh] relative">
          <img 
            src={invitation.main_photo_url} 
            className="w-full h-full object-cover" 
            style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="px-6 pb-12 -mt-24 relative z-10 text-center">
          <div className={`rounded-[3rem] p-10 space-y-8 transition-all duration-700 ${getPaperClass()}`}>
            <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: invitation.font_style || 'Inter' }}>
              {invitation.title}
            </h1>
            <p className="text-lg opacity-80 italic tracking-wide">{invitation.host_names}</p>
            
            <div className="flex flex-col items-center gap-6 pt-4">
              <div className="flex flex-col items-center gap-2">
                <Calendar className="opacity-40" />
                <span className="font-bold text-sm uppercase tracking-[0.2em]">
                  {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Date à venir"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MapPin className="opacity-40" />
                <span className="text-sm font-medium">{invitation.event_address}</span>
              </div>
            </div>

            <div className="pt-8 text-[10px] font-black uppercase tracking-[0.4em] opacity-30">
              Invitation Digitale
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}