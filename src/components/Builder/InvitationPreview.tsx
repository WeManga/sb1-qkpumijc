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
  
  // États pour l'animation du boîtier à code digital (6 chiffres)
  const [isVaultClicked, setIsVaultClicked] = useState(false);
  const [displayedCode, setDisplayedCode] = useState(['*', '*', '*', '*', '*', '*']);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isCodeFading, setIsCodeFading] = useState(false);
  
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

  // Extraction et formatage de la date choisie pour le code secret (Ex: 24 Juin = "2406")
  const targetCode = useMemo(() => {
    const dateSource = invitation?.vault_date || invitation?.event_date;
    if (!dateSource) return "123456";
    const d = new Date(dateSource);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); // Récupère les 2 derniers chiffres de l'année
    return `${day}${month}${year}`;
  }, [invitation?.vault_date, invitation?.event_date]);

  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, invitation?.music_url]);

  // LOGIQUE DE DÉFILEMENT DE 6 CHIFFRES : Gère l'attente infinie ET la fixation après clic
  useEffect(() => {
    if (!isOpened && invitation.opening_style === 'vault') {
      let currentDigitIndex = 0;

      // Boucle permanente de chiffres et touches aléatoires au chargement
      const interval = setInterval(() => {
        setDisplayedCode((prev) => {
          const next = [...prev];
          const startIndex = isVaultClicked ? currentDigitIndex : 0;
          for (let i = startIndex; i < 6; i++) {
            next[i] = String(Math.floor(Math.random() * 10));
          }
          return next;
        });

        const randomKey = String(Math.floor(Math.random() * 10));
        setActiveKey(randomKey);
      }, 75);

      let digitLockTimers: NodeJS.Timeout[] = [];
      let endTimer: NodeJS.Timeout;

      // C'est SEULEMENT après le clic qu'on enclenche la fixation séquentielle des 6 chiffres
      if (isVaultClicked) {
        digitLockTimers = Array.from({ length: 6 }).map((_, index) => {
          return setTimeout(() => {
            currentDigitIndex = index + 1;
            setDisplayedCode((prev) => {
              const next = [...prev];
              next[index] = targetCode[index];
              return next;
            });
            setActiveKey(targetCode[index]);
          }, (index + 1) * 550); // Ajustement de la vitesse de découverte pour les 6 chiffres
        });

        endTimer = setTimeout(() => {
          clearInterval(interval);
          setActiveKey(null);
          setIsCodeFading(true); // Lance le fondu sortant du boîtier numérique
          
          setTimeout(() => {
            setIsOpened(true);
            audioRef.current?.play().catch(() => {});
          }, 600);
        }, 4000);
      }

      return () => {
        clearInterval(interval);
        digitLockTimers.forEach(clearTimeout);
        if (endTimer) clearTimeout(endTimer);
      };
    }
  }, [isOpened, invitation.opening_style, isVaultClicked, targetCode]);

  // Déclencheur au clic/toucher de l'interface
  const handleTriggerClick = () => {
    if (invitation.opening_style === 'vault') {
      if (!isVaultClicked) {
        setIsVaultClicked(true); // Arrête l'attente infinie et lance la résolution vers la date
      }
    } else {
      setIsOpened(true);
      audioRef.current?.play().catch(() => {});
    }
  };

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

  const isDoorType = invitation.container_open === 'wooden_door' || invitation.container_open === 'metal_door';

  return (
    <div className="relative w-full h-full max-h-[650px] flex items-center justify-center overflow-hidden bg-white rounded-[3.5rem] shadow-2xl border-[12px] border-gray-50/50" style={{ fontFamily: invitation.font_style || 'inherit' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
            {isOpened && invitation?.music_url && (
              <button onClick={toggleMute} className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} className="animate-pulse"/>}
              </button>
            )}

            {/* --- VINYLE OU PELLICULE --- */}
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
                          <img src={imgObj.url} className="w-full h-full object-cover grayscale-[0.2] contrast-125" 
                            style={{ transform: `translate(${invitation[`${imgObj.key}_pos_x`] || 0}px, ${invitation[`${imgObj.key}_pos_y`] || 0}px) scale(${invitation[`${imgObj.key}_scale`] || 1})` }} alt="" />
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
                        <img src={invitation.main_photo_url} className="w-full h-full object-cover" 
                          style={{ transform: `translate(${invitation.main_photo_url_pos_x || 0}px, ${invitation.main_photo_url_pos_y || 0}px) scale(${invitation.main_photo_url_scale || 1})` }} alt="" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* --- CARTE COMMUNE CENTRALE --- */}
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

            {/* --- COUCHE DECLENCHEURS MECANIQUES ET FOND --- */}
            <div className="absolute inset-0 z-50 overflow-hidden" style={{ perspective: '2000px', pointerEvents: isOpened ? 'none' : 'auto' }}>
              <AnimatePresence>
                {!isOpened && (
                  <motion.div 
                    key="gate-container" 
                    exit={{ opacity: 1 }} 
                    className="w-full h-full relative flex items-center justify-center"
                  >
                    <AnimatePresence>
                      {!isCodeFading && (
                        <motion.div 
                          key="visual-trigger"
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
                          className="absolute inset-0 z-[70] flex flex-col items-center justify-center cursor-pointer" 
                          onClick={handleTriggerClick}
                        >
                          <div className="relative w-full flex items-center justify-center">
                            {invitation.opening_style === 'knock' ? (
                              <motion.div 
                                animate={{ 
                                  x: [0, -12, 4, -12, 4, 0],
                                  y: [0, -6, 2, -6, 2, 0],
                                  scale: [1, 1.05, 0.98, 1.05, 0.98, 1]
                                }} 
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
                                className="w-56 h-56 select-none flex items-center justify-center"
                              >
                                <img 
                                  src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/main-qui-toque.PNG" 
                                  className="w-full h-full object-contain drop-shadow-2xl" 
                                  alt="Main qui toque" 
                                />
                              </motion.div>
                            ) : invitation.opening_style === 'key' ? (
                                <div className="select-none flex items-center justify-center relative w-[260px] h-[260px]">
                                  <img 
                                    src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/cleserrure.png" 
                                    className="absolute w-full h-full object-contain" 
                                    alt="Serrure" 
                                  />
                                  <motion.img
                                    src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/cleserrure.png" 
                                    animate={{ rotate: [0, 45, 0, 45, 0] }}
                                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
                                    className="absolute w-full h-full object-contain origin-center"
                                    alt="Clé"
                                  />
                                </div>
                            ) : invitation.opening_style === 'vault' ? (
                              /* --- BOITIER DIGITAL TACTILE (6 CHIFFRES) --- */
                              <div className="relative w-[300px] h-[440px] flex flex-col items-center justify-start bg-neutral-900 border-[6px] border-neutral-800 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden p-6">
                                <img 
                                  src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/dgital.png" 
                                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none" 
                                  alt="" 
                                />

                                {/* Écran LCD Supérieur */}
                                <div className="w-full h-24 bg-black/95 rounded-2xl border-2 border-neutral-800 p-3 flex flex-col items-center justify-center shadow-inner relative z-10 mb-8">
                                  <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 font-bold uppercase mb-1">🔒 Invit Studio</span>
                                  <div className="flex gap-1.5">
                                    {displayedCode.map((digit, index) => (
                                      <motion.span
                                        key={index}
                                        initial={{ scale: 1.3 }}
                                        animate={{ scale: 1 }}
                                        className="text-sky-500 font-mono text-2xl font-black drop-shadow-[0_0_10px_rgba(14,165,233,0.8)] tracking-wider"
                                      >
                                        {digit}
                                      </motion.span>
                                    ))}
                                  </div>
                                </div>

                                {/* Clavier Rétroéclairé Bleu */}
                                <div className="grid grid-cols-3 gap-3 w-full max-w-[210px] relative z-10">
                                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => {
                                    const isGlowing = activeKey === key;
                                    return (
                                      <motion.div
                                        key={key}
                                        animate={isGlowing ? {
                                          backgroundColor: 'rgba(14, 165, 233, 0.35)',
                                          borderColor: '#38bdf8',
                                          boxShadow: '0 0 15px rgba(56, 189, 248, 0.7)',
                                          scale: 0.95
                                        } : {
                                          backgroundColor: 'rgba(23, 23, 23, 0.85)',
                                          borderColor: 'rgba(63, 63, 70, 0.3)',
                                          boxShadow: 'none',
                                          scale: 1
                                        }}
                                        className="aspect-square flex items-center justify-center rounded-xl border font-mono font-bold text-xl text-neutral-400 transition-all select-none"
                                      >
                                        <span className={isGlowing ? "text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]" : ""}>
                                          {key}
                                        </span>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                                <div className="mt-5 font-mono text-[9px] tracking-widest text-neutral-500 animate-pulse uppercase">
                                  {isVaultClicked ? "CRACKING CODE..." : "Tap Device to Unlock"}
                                </div>
                              </div>
                            ) : (
                              <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-[32rem] h-[32rem] object-contain" alt="Sceau" />
                            )}
                          </div>
                          
                          <p className="absolute bottom-12 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse text-center w-full px-4">
                            {lang === 'fr' ? "Appuyez pour ouvrir l'invitation" : lang === 'en' ? "Tap to open invitation" : "Nhấn de mở lời mời"}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ANIMATION DES CONTENANTS DÉCOUPLÉS */}
                    {isDoorType ? (
                      <div className="absolute inset-0 z-50 flex w-full h-full" style={{ perspective: '2000px' }}>
                        <motion.div 
                          exit={{ rotateY: -100, x: '-20%', opacity: 0 }} 
                          transition={{ duration: 1.2, ease: "easeInOut" }} 
                          className="w-1/2 h-full origin-left bg-cover bg-center shadow-2xl border-r border-black/10" 
                          style={{ 
                            backgroundImage: invitation.container_open === 'metal_door' ? 'none' : `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20gauche.png")`, 
                            backgroundColor: invitation?.envelope_color || '#FEE2E2' 
                          }} 
                        />
                        <motion.div 
                          exit={{ rotateY: 100, x: '20%', opacity: 0 }} 
                          transition={{ duration: 1.2, ease: "easeInOut" }} 
                          className="w-1/2 h-full origin-right bg-cover bg-center shadow-2xl border-l border-black/10" 
                          style={{ 
                            backgroundImage: invitation.container_open === 'metal_door' ? 'none' : `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20droite.png")`, 
                            backgroundColor: invitation?.envelope_color || '#FEE2E2' 
                          }} 
                        />
                      </div>
                    ) : (
                      <motion.div exit={{ y: "-100%" }} transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }} className="absolute inset-0 z-50 shadow-2xl" style={{ background: invitation?.envelope_color || '#FEE2E2' }} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              <div className="space-y-12 pb-10">
                <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] text-center mb-8 flex items-center justify-center gap-2">
                  <Sparkles size={12}/> {tBuilder.program_title} <Sparkles size={12}/>
                </h3>
                <div className="relative flex flex-col items-center">
                  <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 3.0, ease: "easeInOut" }} className="absolute top-0 w-[2px] h-full bg-gradient-to-b from-amber-200 via-amber-500 to-amber-200 rounded-full origin-top" />
                  <div className="relative space-y-12 w-full pt-4">
                    {(invitation.event_program || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: isEven ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 1.2, delay: 0.1 }} className={`flex items-center w-full relative ${isEven ? 'justify-start pl-6' : 'justify-end pr-6'}`}>
                          <motion.div initial={{ scale: 0, rotate: 45 }} whileInView={{ scale: 1, rotate: 45 }} viewport={{ once: true }} className={`absolute top-1/2 -translate-y-1/2 z-20 w-3 h-3 bg-amber-500 border border-white shadow-md ${isEven ? 'right-[50%] translate-x-1/2' : 'left-[50%] -translate-x-1/2'}`}>
                            <motion.div animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute inset-0 bg-amber-300 rounded-sm" />
                          </motion.div>
                          <div className={`w-[45%] overflow-hidden bg-white/60 rounded-2xl border border-amber-50 backdrop-blur-sm shadow-lg ${isEven ? 'text-left' : 'text-right'}`}>
                            {step.image_url && <div className="w-full aspect-video overflow-hidden"><img src={step.image_url} className="w-full h-full object-cover" alt="" /></div>}
                            <div className="p-4">
                              <div className={`text-[9px] font-black text-amber-600 mb-1 flex items-center gap-1 ${isEven ? 'justify-start' : 'justify-end'}`}><Clock size={8}/> {step.time}</div>
                              <div className="text-[11px] font-bold uppercase tracking-tight leading-tight" style={{ fontFamily: invitation.font_style }}>{step.activity}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {invitation.plan_type === 'PREMIUM' && invitation.end_photo_url && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20 px-2 pb-10">
                  <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white rotate-2">
                    <img src={invitation.end_photo_url} className="w-full h-auto" style={{ transform: `translate(${invitation.end_photo_url_pos_x || 0}px, ${invitation.end_photo_url_pos_y || 0}px) scale(${invitation.end_photo_url_scale || 1})` }} alt="Final" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}