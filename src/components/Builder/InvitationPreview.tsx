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
  const [vaultCode, setVaultCode] = useState(0);
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

  useEffect(() => {
    if (!isOpened && invitation.opening_style === 'vault') {
      const interval = setInterval(() => {
        setVaultCode(Math.floor(Math.random() * 99));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isOpened, invitation.opening_style]);

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

  const isDoorType = invitation.opening_style === 'key' || invitation.opening_style === 'vault';

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

            {/* --- ENVELOPPE OU PORTE --- */}
            <AnimatePresence>
              {!isOpened && (
                <div className="absolute inset-0 z-50 overflow-hidden" style={{ perspective: '2000px' }}>
                  {isDoorType ? (
                    <>
                      <motion.div 
                        exit={{ rotateY: -110, originX: 0, opacity: 0 }} 
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-y-0 left-0 w-1/2 z-50 border-r border-white/10 shadow-2xl"
                        style={{ background: invitation?.envelope_color || '#FEE2E2' }}
                      />
                      <motion.div 
                        exit={{ rotateY: 110, originX: 1, opacity: 0 }} 
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-y-0 right-0 w-1/2 z-50 border-l border-white/10 shadow-2xl"
                        style={{ background: invitation?.envelope_color || '#FEE2E2' }}
                      />
                    </>
                  ) : (
                    <motion.div 
                      exit={{ y: "-100%" }} 
                      animate={invitation.opening_style === 'knock' ? {
                        x: [0, -1, 2, -2, 1, 0, 0, -1, 2, -2, 1, 0, 0], 
                        y: [0, 1, -1, 1, -1, 0, 0, 1, -1, 1, -1, 0, 0]
                      } : {}}
                      transition={invitation.opening_style === 'knock' ? {
                        duration: 0.6, repeat: Infinity, repeatDelay: 1.2
                      } : { duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0 z-50 shadow-2xl"
                      style={{ background: invitation?.envelope_color || '#FEE2E2' }}
                    />
                  )}

                  <motion.div 
                    exit={{ opacity: 0, scale: 0.8 }} 
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setIsOpened(true)}
                  >
                    {invitation.opening_style === 'knock' ? (
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{ rotateX: [0, -40, 0, -40, 0], z: [0, 80, 0, 80, 0], scale: [1, 1.15, 1, 1.15, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }}
                          style={{ originY: "100%" }}
                          className="text-[140px]"
                        >✊</motion.div>
                        <p className="mt-8 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t.tap_open}</p>
                      </div>
                    ) : invitation.opening_style === 'key' ? (
                      <div className="flex flex-col items-center relative">
                        {/* Serrure Antique */}
                        <div className="w-28 h-40 bg-gradient-to-b from-[#1a1a1a] to-[#333] rounded-full border-4 border-[#444] shadow-2xl flex flex-col items-center justify-center relative">
                           <div className="w-3 h-12 bg-black rounded-full mb-1 shadow-inner" />
                           <div className="w-8 h-8 bg-black rounded-full shadow-inner" />
                           
                           {/* Clé Ancienne insérée */}
                           <motion.div
                             animate={{ rotate: [0, 35, 0, 35, 0] }}
                             transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                             className="absolute text-7xl z-10"
                             style={{ top: '15%', transformOrigin: "center 60%" }}
                           >🗝️</motion.div>
                        </div>
                        <p className="mt-12 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t.tap_open}</p>
                      </div>
                    ) : invitation.opening_style === 'vault' ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-64 h-64 flex flex-col items-center justify-center">
                           {/* Plaque métal du fond */}
                           <div className="absolute inset-0 bg-[#2c2c2c] rounded-full border-8 border-[#3d3d3d] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8),0_20px_40px_rgba(0,0,0,0.4)]" />
                           
                           {/* Fenêtre de Code */}
                           <div className="absolute top-12 bg-[#1a1a1a] px-4 py-1 rounded border border-gray-600 shadow-inner z-20">
                              <span className="text-red-600 font-mono text-xl tracking-[0.3em] drop-shadow-[0_0_5px_red]">
                                {vaultCode < 10 ? `0${vaultCode}` : vaultCode}
                              </span>
                           </div>

                           {/* Cadran Central tournant */}
                           <motion.div
                             animate={{ rotate: [0, 120, -60, 240, 0] }}
                             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                             className="w-44 h-44 rounded-full border-[10px] border-[#4a4a4a] bg-gradient-to-br from-[#333] to-[#111] shadow-2xl flex items-center justify-center relative z-10"
                           >
                              {/* Graduation */}
                              {[...Array(12)].map((_, i) => (
                                <div key={i} className="absolute w-1 h-3 bg-gray-500" style={{ transform: `rotate(${i * 30}deg) translateY(-70px)` }} />
                              ))}
                              {/* Moyeu central */}
                              <div className="w-14 h-14 rounded-full bg-[#222] border-4 border-[#333] shadow-inner flex items-center justify-center">
                                 <div className="w-2 h-10 bg-red-600 rounded-full -translate-y-2 shadow-[0_0_8px_rgba(255,0,0,0.6)]" />
                              </div>
                           </motion.div>
                        </div>
                        <p className="mt-8 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t.tap_open}</p>
                      </div>
                    ) : (
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
              {/* Le reste du programme et photo finale... */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```[cite: 1]