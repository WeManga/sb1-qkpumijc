import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Volume2, VolumeX, MapPin, Clock, Sparkles, Film } from 'lucide-react';
import { translations, Language } from '../../lib/i18n';

const THEME_EMOJIS: Record<string, string[]> = {
  wedding: ['🤍', '💍', '🕊️', '✨', '🌸'],
  birthday: ['🎂', '🎈', '✨', '🎉', '🍰'],
  party: ['✨', '🎸', '🥂', '🕺', '🌟'],
  baptism: ['👼', '☁️', '🤍', '✨', '🕊️'],
  babyshower: ['🍼', '🤍', '👶', '💖', '💙'],
  funeral: ['🙏', '🕊️', '🥀', '⚰️', '🤍'],
  default: ['✨', '🌟', '🤍']
};

export function InvitationPreview({ invitation }: any) {
  const [isOpened, setIsOpened] = useState(false);
  const [view, setView] = useState<'envelope' | 'content'>('envelope');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const lang = (invitation.language as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].guest;
  const tBuilder = translations[lang].builder;
  const emojis = THEME_EMOJIS[invitation?.event_type] || THEME_EMOJIS.default;
  
  const getPaperClass = () => {
    switch(invitation.paper_type) {
      case 'parchment': return 'paper-parchment';
      case 'grainy': return 'paper-grainy';
      case 'cotton': return 'paper-cotton';
      case 'silk': return 'paper-silk';
      case 'velvet': return 'paper-velvet';
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
    <div className="relative w-full h-full max-h-[650px] flex items-center justify-center overflow-hidden bg-white rounded-[3.5rem] shadow-2xl border-[12px] border-gray-50/50" style={{ fontFamily: invitation.font_style || 'inherit' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center">
            {isOpened && invitation?.music_url && (
              <button onClick={toggleMute} className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} className="animate-pulse"/>}
              </button>
            )}

            {/* --- ANIMATION D'OUVERTURE (VINYLE OU PELLICULE) --- */}
            <motion.div 
              initial={{ y: -450 }} 
              animate={isOpened ? { y: invitation.opening_type === 'filmstrip' ? -35 : 25 } : { y: -450 }} 
              transition={{ type: "spring", damping: 25 }} 
              className="absolute top-0 z-20"
            >
              {invitation.opening_type === 'filmstrip' ? (
                <div className="relative w-44 h-72 bg-[#1a1a1a] rounded-xl shadow-2xl rotate-[-2deg] overflow-hidden p-2 border-y-4 border-[#1a1a1a]">
                  <div className="absolute inset-y-0 left-1.5 w-1.5 border-l-2 border-dashed border-white/20 z-10" />
                  <div className="absolute inset-y-0 right-1.5 w-1.5 border-r-2 border-dashed border-white/20 z-10" />
                  <motion.div animate={{ y: [0, -360] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="flex flex-col gap-2">
                    {[
                      { url: invitation.main_photo_url, key: 'main_photo_url' },
                      { url: invitation.photo_url_2, key: 'photo_url_2' },
                      { url: invitation.photo_url_3, key: 'photo_url_3' },
                      { url: invitation.main_photo_url, key: 'main_photo_url' },
                      { url: invitation.photo_url_2, key: 'photo_url_2' },
                      { url: invitation.photo_url_3, key: 'photo_url_3' }
                    ].map((imgObj, idx) => (
                      <div key={idx} className="w-full h-28 bg-[#222] rounded-sm overflow-hidden relative shrink-0">
                        {imgObj.url ? (
                          <img 
                            src={imgObj.url} 
                            className="w-full h-full object-cover grayscale-[0.2] contrast-125" 
                            style={{ transform: `translate(${invitation[`${imgObj.key}_pos_x`] || 0}px, ${invitation[`${imgObj.key}_pos_y`] || 0}px) scale(${invitation[`${imgObj.key}_scale`] || 1})` }}
                            alt="" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800"><Film className="text-gray-600" size={20}/></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className={`w-[270px] h-[270px] relative ${isOpened ? 'animate-disk-spin' : ''}`}>
                  <div className="absolute inset-0 rounded-full bg-[#111] overflow-hidden">
                      <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full border-[5px] border-[#111] overflow-hidden">
                      {invitation.main_photo_url && (
                        <img 
                          src={invitation.main_photo_url} 
                          className="w-full h-full object-cover" 
                          style={{ transform: `translate(${invitation.main_photo_url_pos_x || 0}px, ${invitation.main_photo_url_pos_y || 0}px) scale(${invitation.main_photo_url_scale || 1})` }} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* --- CARTE D'INVITATION --- */}
            <motion.div 
              initial={{ scale: 0.8, y: 200 }} 
              animate={isOpened ? { scale: 1, y: 135 } : {}} 
              transition={{ type: "spring", damping: 20, delay: 0.4 }} 
              onClick={() => isOpened && setView('content')} 
              className={`z-30 w-[310px] h-[370px] rounded-[3rem] shadow-xl p-10 flex flex-col items-center justify-between border border-gray-100 cursor-pointer ${getPaperClass()}`}
            >
              <div className="text-center pt-14 w-full">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 break-words" style={{ fontFamily: invitation.font_style }}>
                  {invitation?.title || tBuilder.title_placeholder}
                </h2>
                <div className="w-8 h-1 bg-amber-400 mx-auto mb-4" />
                <p className="opacity-60 text-[9px] font-bold uppercase tracking-[0.3em]">{t.tap_open}</p>
              </div>
              <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">
                {lang === 'vi' ? 'Xem chi tiết' : lang === 'en' ? 'See details' : 'Voir les détails'}
              </div>
            </motion.div>

            {/* --- ENVELOPPE OU PORTE INTERACTIVE --- */}
            <AnimatePresence>
              {!isOpened && (
                <div className="absolute inset-0 z-50 overflow-hidden" style={{ perspective: '2000px' }}>
                  {/* Battant Gauche */}
                  <motion.div 
                    exit={{ rotateY: -110, originX: 0, x: -20, opacity: 0 }} 
                    transition={{ duration: 1.2, ease: [0.45, 0.05, 0.55, 0.95] }}
                    className="absolute inset-y-0 left-0 w-1/2 z-50 border-r border-white/10"
                    style={{ background: invitation?.envelope_color || '#FEE2E2' }}
                  />
                  {/* Battant Droit */}
                  <motion.div 
                    exit={{ rotateY: 110, originX: 1, x: 20, opacity: 0 }} 
                    transition={{ duration: 1.2, ease: [0.45, 0.05, 0.55, 0.95] }}
                    className="absolute inset-y-0 right-0 w-1/2 z-50 border-l border-white/10"
                    style={{ background: invitation?.envelope_color || '#FEE2E2' }}
                  />

                  {/* Contenu Interactif (Clé, Main, Coffre) */}
                  <motion.div 
                    exit={{ opacity: 0, scale: 0.8 }} 
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setIsOpened(true)}
                  >
                    {invitation.opening_style === 'knock' ? (
                      /* MAIN QUI TOQUE */
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{ rotateX: [0, -40, 0, -40, 0], z: [0, 80, 0, 80, 0], scale: [1, 1.15, 1, 1.15, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }}
                          style={{ originY: "100%" }}
                          className="text-[140px] drop-shadow-2xl"
                        >✊</motion.div>
                        <p className="mt-8 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t.tap_open}</p>
                      </div>
                    ) : invitation.opening_style === 'key' ? (
                      /* ANCIENNE SERRURE ET CLÉ */
                      <div className="flex flex-col items-center relative">
                        <div className="w-32 h-48 bg-[#2a2a2a] rounded-t-full rounded-b-xl border-4 border-[#1a1a1a] shadow-2xl flex flex-col items-center pt-8 relative overflow-hidden">
                           <div className="w-4 h-16 bg-black rounded-full shadow-inner" />
                           <div className="w-10 h-10 bg-black rounded-full -mt-2 shadow-inner" />
                           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        </div>
                        <motion.div
                          initial={{ x: -150, opacity: 0, rotate: -45 }}
                          animate={{ x: 0, opacity: 1, rotate: [0, 0, 90, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                          className="absolute text-8xl drop-shadow-2xl z-10 top-12"
                        >🔑</motion.div>
                        <p className="mt-12 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t.tap_open}</p>
                      </div>
                    ) : invitation.opening_style === 'vault' ? (
                      /* COFFRE FORT RÉALISTE */
                      <div className="flex flex-col items-center">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                           <div className="absolute inset-0 bg-[#333] rounded-full border-8 border-[#444] shadow-2xl" />
                           <motion.div
                             animate={{ rotate: [0, 90, -120, 180, 0] }}
                             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                             className="w-48 h-48 rounded-full border-8 border-dashed border-white/20 flex items-center justify-center bg-[#2a2a2a] shadow-inner relative z-10"
                           >
                              <div className="w-12 h-12 bg-red-600 rounded-full border-4 border-white/30 shadow-lg" />
                              {[...Array(8)].map((_, i) => (
                                <div key={i} className="absolute w-2 h-8 bg-white/40 rounded-full" style={{ transform: `rotate(${i * 45}deg) translateY(-80px)` }} />
                              ))}
                           </motion.div>
                           <div className="absolute -right-8 w-12 h-40 bg-gradient-to-b from-[#444] to-[#222] rounded-full shadow-xl border-4 border-[#555]" />
                        </div>
                        <p className="mt-12 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t.tap_open}</p>
                      </div>
                    ) : (
                      /* VOLET CLASSIQUE */
                      <div className="flex flex-col items-center">
                        <div className="w-[32rem] h-[32rem] flex items-center justify-center p-0 overflow-visible">
                          <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain" alt="Sceau" />
                        </div>
                        <p className="mt-8 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t.tap_open}</p>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* --- CONTENU --- */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`w-full h-full z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="h-[30%] relative overflow-hidden shrink-0">
               <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ transform: `translate(${invitation.main_photo_url_pos_x || 0}px, ${invitation.main_photo_url_pos_y || 0}px) scale(${invitation.main_photo_url_scale || 1})` }} />
               <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
               <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md"><X size={20}/></button>
            </div>
            <div className="flex-1 p-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black mb-4 leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation?.host_names || tBuilder.hosts_placeholder}</h2>
                <div className="flex flex-col items-center gap-2 opacity-60 font-bold text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-amber-500"/> {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {day:'numeric', month:'long', year:'numeric'}) : t.save_date}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-amber-500"/> {invitation.event_address || tBuilder.address_placeholder}</div>
                </div>
              </div>
              {invitation.description && (
                <div className="mb-14 text-center">
                  <p className="text-[13px] leading-relaxed opacity-80 whitespace-pre-wrap italic" style={{ fontFamily: invitation.font_style }}>{invitation.description}</p>
                  <div className="w-12 h-[1px] bg-amber-200 mx-auto mt-6" />
                </div>
              )}
              {/* Le reste du code (programme, etc.) demeure inchangé */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}