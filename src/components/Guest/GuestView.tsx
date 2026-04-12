import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Volume2, VolumeX, MapPin, Clock } from 'lucide-react';

const THEME_EMOJIS: Record<string, string[]> = {
  wedding: ['🤍', '💍', '🕊️', '✨', '🌸'],
  birthday: ['🎂', '🎈', '✨', '🎉', '🍰'],
  party: ['✨', '🎸', '🥂', '🕺', '🌟'],
  baptism: ['👼', '☁️', '🤍', '✨', '🕊️'],
  babyshower: ['🍼', '🤍', '👶', '💖', '💙'],
  funeral: ['🙏', '🕊️', '🥀', '⚰️', '🤍'],
  default: ['✨', '🌟', '🤍']
};

export function GuestView({ invitation }: any) {
  const [isOpened, setIsOpened] = useState(false);
  const [view, setView] = useState<'envelope' | 'content'>('envelope');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const emojis = THEME_EMOJIS[invitation?.event_type] || THEME_EMOJIS.default;

  const getPaperClass = () => {
    switch(invitation.paper_type) {
      case 'parchment': return 'paper-parchment';
      case 'grainy': return 'paper-grainy';
      case 'cotton': return 'paper-cotton';
      default: return 'paper-smooth';
    }
  };

  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, invitation?.music_url]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const EmojiRain = () => {
    const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${(i * 4) + (Math.random() * 3)}%`,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 2
    })), [emojis]);

    return (
      <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span key={p.id} initial={{ y: -50, opacity: 0 }} animate={{ y: 800, opacity: [0, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
            className="absolute text-3xl" style={{ left: p.left }}>{p.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden transition-colors duration-700" style={{ backgroundColor: invitation.envelope_color || '#F3F4F6' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center">
            {isOpened && invitation?.music_url && (
              <button onClick={toggleMute} className="absolute top-10 right-10 z-[70] w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                {isMuted ? <VolumeX size={20} className="text-gray-600"/> : <Volume2 size={20} className="text-amber-600 animate-pulse"/>}
              </button>
            )}

            {/* DISQUE VINYLE */}
            <motion.div initial={{ y: -600 }} animate={isOpened ? { y: -120 } : { y: -600 }} transition={{ type: "spring", damping: 25, stiffness: 120 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[300px] h-[300px] z-20">
              <div className={`w-full h-full relative ${isOpened ? 'animate-disk-spin' : ''}`}>
                <div className="absolute inset-0 rounded-full bg-[#111] shadow-2xl">
                   <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 bg-white rounded-full border-[6px] border-[#111] overflow-hidden shadow-inner">
                    {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARTE */}
            <motion.div 
              initial={{ scale: 0.8, y: 300 }} 
              animate={isOpened ? { scale: 1, y: 150 } : {}} 
              transition={{ type: "spring", damping: 20, delay: 0.4 }} 
              onClick={() => isOpened && setView('content')} 
              className={`z-30 w-[340px] h-[400px] rounded-[3rem] shadow-2xl p-10 flex flex-col items-center justify-between border border-white/20 cursor-pointer ${getPaperClass()} hover:scale-[1.02] transition-transform`}
            >
              <div className="text-center pt-14 w-full">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 break-words" style={{ fontFamily: invitation.font_style || 'inherit' }}>
                  {invitation?.title || "Votre Titre"}
                </h2>
                <div className="w-12 h-1 bg-amber-400 mx-auto mb-6" />
                <p className="opacity-60 text-[10px] font-black uppercase tracking-[0.4em] animate-bounce">Découvrir le programme</p>
              </div>
              <div className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase text-center tracking-widest shadow-lg">Voir les détails</div>
            </motion.div>

            {/* ENVELOPPE (Sceau) */}
            <AnimatePresence>
              {!isOpened && (
                <motion.div exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.8, ease: "easeInOut" }} className="absolute inset-0 z-50 flex flex-col items-center justify-center px-4" style={{ backgroundColor: invitation?.envelope_color || '#FEE2E2' }}>
                  <button onClick={() => setIsOpened(true)} className="w-full max-w-[450px] aspect-square flex items-center justify-center hover:scale-105 transition-transform p-0 active:scale-95">
                    <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" alt="Sceau" />
                  </button>
                  <p className="text-white font-black text-xs uppercase tracking-[0.6em] -mt-10 animate-pulse">Ouvrir l'invitation</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* VUE CONTENU DÉTAILLÉ */
          <motion.div key="content" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className={`w-full h-full max-w-lg z-[100] flex flex-col shadow-2xl ${getPaperClass()}`}>
            <div className="h-[35%] relative overflow-hidden shrink-0">
               <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
               <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
               <button onClick={() => setView('envelope')} className="absolute top-8 left-8 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl text-gray-800 backdrop-blur-sm"><X size={24}/></button>
            </div>

            <div className="flex-1 p-10 overflow-y-auto bg-white/40">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black mb-6 leading-tight" style={{ fontFamily: invitation.font_style || 'inherit' }}>
                  {invitation?.host_names || "Noms des Hôtes"}
                </h2>
                <div className="flex flex-col items-center gap-4 opacity-70 font-bold text-[11px] uppercase tracking-widest">
                  <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-full shadow-sm"><Calendar size={16} className="text-amber-500"/> {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'}) : "Date à venir"}</div>
                  <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-full shadow-sm"><MapPin size={16} className="text-amber-500"/> {invitation.event_address || "Lieu non défini"}</div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.4em] text-center mb-10 flex items-center justify-center gap-4">
                  <div className="h-[1px] w-12 bg-amber-200" /> Programme <div className="h-[1px] w-12 bg-amber-200" />
                </h3>
                
                <div className="relative border-l-2 border-amber-100 ml-4 pl-8 space-y-10">
                  {(invitation.event_program || []).map((step: any, i: number) => (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="relative">
                      <div className="absolute -left-[41px] top-0 w-5 h-5 bg-amber-400 rounded-full border-4 border-white shadow-sm" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-black text-amber-600 flex items-center gap-2"><Clock size={12}/> {step.time}</span>
                        <span className="text-lg font-bold text-gray-800" style={{ fontFamily: invitation.font_style || 'inherit' }}>{step.activity}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* SECTION RSVP (SIMULÉE) */}
              <div className="mt-20 pt-10 border-t border-gray-100 text-center">
                 <button className="w-full py-5 bg-amber-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-amber-200 hover:bg-amber-600 transition-colors">
                   Confirmer ma présence
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}