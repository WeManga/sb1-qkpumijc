import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Calendar, Volume2, VolumeX } from 'lucide-react';

const THEME_EMOJIS: Record<string, string[]> = {
  wedding: ['🤍', '💍', '🕊️', '✨', '🌸'],
  birthday: ['🎂', '🎈', '✨', '🎉', '🍰'],
  party: ['✨', '🎸', '🥂', '🕺', '🌟'],
  baptism: ['👼', '☁️', '🤍', '✨', '🕊️'],
  default: ['✨', '🌟', '🤍']
};

export function InvitationPreview({ invitation }: any) {
  const [isOpened, setIsOpened] = useState(false);
  const [view, setView] = useState<'envelope' | 'content'>('envelope');
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const eventList = invitation?.event_program || [];
  const emojis = THEME_EMOJIS[invitation?.event_type] || THEME_EMOJIS.default;
  const envelopeColor = invitation?.envelope_color || '#FEE2E2';

  // CALCUL DE LA POSITION DE L'IMAGE DYNAMIQUE
  const imageStyle = {
    objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%`,
    objectFit: 'cover' as const
  };

  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(err => console.log("Lecture auto bloquée"));
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
      <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden emoji-container">
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
    <div className="relative w-full h-full max-h-[650px] flex items-center justify-center overflow-hidden bg-white rounded-[3.5rem] shadow-2xl border-[12px] border-gray-50/50">
      
      {invitation?.music_url && (
        <audio ref={audioRef} src={invitation.music_url} loop />
      )}

      {isOpened && <EmojiRain />}
      
      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center">
            
            {isOpened && invitation?.music_url && (
              <button 
                onClick={toggleMute}
                className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-gray-800"
              >
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} className="animate-pulse"/>}
              </button>
            )}

            <motion.div 
              initial={{ y: -450 }} 
              animate={isOpened ? { y: 25 } : { y: -450 }} 
              transition={{ type: "spring", damping: 25, stiffness: 120 }} 
              className="absolute top-0 w-[270px] h-[270px] z-20"
            >
              <div className={`w-full h-full relative ${isOpened ? 'animate-disk-spin' : ''}`}>
                <div className="absolute inset-0 rounded-full bg-[#111] shadow-2xl overflow-hidden">
                   <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                   <div className="absolute inset-0 vinyl-gloss opacity-40" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white rounded-full border-[5px] border-[#111] overflow-hidden shadow-inner">
                    {invitation?.main_photo_url ? (
                      <img 
                        src={invitation.main_photo_url} 
                        className="w-full h-full" 
                        style={imageStyle} // Ajout de la position dynamique ici
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-100 flex items-center justify-center text-amber-500 font-bold text-[10px] uppercase p-4 text-center">Photo ici</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.8, y: 200 }} 
              animate={isOpened ? { scale: 1, y: 135 } : {}} 
              transition={{ type: "spring", damping: 20, delay: 0.4 }} 
              onClick={() => isOpened && setView('content')} 
              className="z-30 w-[310px] h-[370px] bg-white rounded-[3rem] shadow-xl paper-texture p-10 flex flex-col items-center justify-between border border-gray-100 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="text-center pt-14">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-4">{invitation?.title || "Invitation"}</h2>
                <div className="w-8 h-1 bg-amber-400 mx-auto mb-4" />
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.3em]">Découvrir le programme</p>
              </div>
              <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest shadow-lg">Voir les détails</div>
            </motion.div>

            <AnimatePresence>
              {!isOpened && (
                <motion.div 
                  exit={{ y: "-100%" }} 
                  transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }} 
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center" 
                  style={{ backgroundColor: envelopeColor }}
                >
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpened(true)} 
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl text-amber-500"
                  >
                    <Sparkles className="w-8 h-8"/>
                  </motion.button>
                  <p className="text-white font-black text-[10px] uppercase tracking-[0.5em] mt-8">Ouvrir</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="content" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full bg-white z-[100] paper-texture flex flex-col"
          >
            <div className="h-[25%] relative overflow-hidden shrink-0">
               {invitation?.main_photo_url && (
                 <img 
                   src={invitation.main_photo_url} 
                   className="w-full h-full" 
                   style={imageStyle} // Ajout de la position dynamique ici aussi
                 />
               )}
               <div className="absolute inset-0 bg-black/10" />
               <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-gray-800"><X size={20}/></button>
               
               {invitation?.music_url && (
                <button onClick={toggleMute} className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-gray-800">
                  {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                </button>
               )}
            </div>

            <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-serif italic text-gray-900 mb-2">{invitation?.host_names || "À nous deux"}</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{invitation?.event_address}</p>
              </div>

              <div className="relative pl-2">
                <div className="absolute left-[7px] top-2 bottom-2 timeline-path animate-draw-path" />
                <div className="space-y-12 relative z-10">
                  {eventList.map((item: any, idx: number) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (idx * 0.15) }} className="flex gap-6 items-center">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-4 h-4 bg-amber-400/30 rounded-full animate-ping" />
                        <div className="w-3.5 h-3.5 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full border-2 border-white shadow-md z-10 shrink-0" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-amber-600 mb-0.5 tracking-tighter">{item.time}</span>
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{item.activity}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
                 <div className="bg-amber-50 px-6 py-4 rounded-2xl flex items-center gap-3">
                   <Calendar size={14} className="text-amber-500"/>
                   <span className="text-[10px] font-black uppercase text-amber-700">
                     {invitation?.event_date ? new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long'}) : "Date à venir"}
                   </span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}