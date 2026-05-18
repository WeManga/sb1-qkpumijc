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

  const playSyntheticSound = (type: 'beep' | 'lock' | 'key' | 'open_door' | 'open_metal_door') => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playWavFile = async (path: string) => {
        try {
          const response = await fetch(path);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.start();
        } catch (err) {
          console.error("Impossible de lire le fichier .wav :", path, err);
        }
      };
      
      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'lock') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'key') {
        playWavFile('/sounds/key-turn.wav');
      } else if (type === 'open_door') {
        playWavFile('/sounds/door-open.wav');
      } else if (type === 'open_metal_door') {
        playWavFile('/sounds/metal-door.wav');
      }
    } catch (e) {
      console.error("Le système audio n'a pas pu s'initialiser", e);
    }
  };

  useEffect(() => {
    if (isOpened || isCodeFading) return;

    let loopInterval: NodeJS.Timeout;

    if (invitation.opening_style === 'key') {
      playSyntheticSound('key');
      
      loopInterval = setInterval(() => {
        playSyntheticSound('key');
      }, 2500);
    }

    return () => {
      if (loopInterval) clearInterval(loopInterval);
    };
  }, [isOpened, isCodeFading, invitation.opening_style, isMuted]);

  const targetCode = useMemo(() => {
    const dateSource = invitation?.vault_date || invitation?.event_date;
    if (!dateSource) return "123456";
    const d = new Date(dateSource);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  }, [invitation?.vault_date, invitation?.event_date]);

  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, invitation?.music_url]);

  useEffect(() => {
    if (!isOpened && invitation.opening_style === 'vault') {
      let currentDigitIndex = 0;

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
            playSyntheticSound('beep');
          }, (index + 1) * 550);
        });

        endTimer = setTimeout(() => {
          clearInterval(interval);
          setActiveKey(null);
          playSyntheticSound('lock');
          setIsCodeFading(true);
          
          setTimeout(() => {
            triggerContainerOpening();
          }, 600);
        }, 4000);
      }

      return () => {
        clearInterval(interval);
        digitLockTimers.forEach(clearTimeout);
        if (endTimer) clearTimeout(endTimer);
      };
    }
  }, [isOpened, invitation.opening_style, isVaultClicked, targetCode, invitation.container_open]);

  const triggerContainerOpening = () => {
    if (invitation.container_open === 'wooden_door') {
      playSyntheticSound('open_door');
    } else if (invitation.container_open === 'metal_door') {
      playSyntheticSound('open_metal_door');
    } else {
      playSyntheticSound('open_door');
    }
    setIsOpened(true);
    audioRef.current?.play().catch(() => {});
  };

  const handleHandleClick = () => {
    if (invitation.opening_style === 'vault') {
      if (!isVaultClicked) {
        setIsVaultClicked(true);
      }
    } else {
      setIsCodeFading(true);
      setTimeout(() => {
        triggerContainerOpening();
      }, 400);
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

  const isEnvelopeContainer = !invitation.container_open || invitation.container_open === 'envelope';

  return (
    <div className="relative w-full h-full max-h-[650px] flex items-center justify-center overflow-hidden bg-white rounded-[3.5rem] shadow-2xl border-[12px] border-gray-50/50" style={{ fontFamily: invitation.font_style || 'inherit' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-50/20" style={{ perspective: '1200px' }}>
            {isOpened && invitation?.music_url && (
              <button onClick={toggleMute} className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} className="animate-pulse"/>}
              </button>
            )}

            {/* CONTENEUR DU FOND INTERCHANGEABLE ET DU SYSTÈME D'ENVELOPPE UNIQUE FIXE */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
              
              {/* DÉCORS DE FOND INTERCHANGEABLES */}
              {isEnvelopeContainer && invitation.envelope_decor === 'balloons' && (
                <div className="absolute inset-x-0 top-2 flex justify-center">
                  <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/ballons.png" className="w-[275px] h-auto object-contain select-none" alt="Ballons" />
                </div>
              )}

              {isEnvelopeContainer && invitation.envelope_decor === 'floral' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/flower.png" className="w-full h-full object-cover select-none opacity-90" alt="Fleurs" />
                </div>
              )}

              {/* L'ENVELOPPE FIXE UNIQUE : POSITIONNÉE SUR LE BAS ET PREND TOUTE LA LARGEUR */}
              <div 
                className="absolute inset-x-0 bottom-0 h-[280px] bg-bottom bg-no-repeat bg-contain z-10"
                style={{ 
                  backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/envlp.png")`,
                  backgroundColor: invitation.envelope_color || 'transparent',
                  backgroundBlendMode: 'multiply'
                }}
              />
            </div>

            {/* CADRE ABSOLU DES COUCHES ACTIONS INTERACTIVES INITIALES TACTILES (INSET-0) */}
            <div className="absolute inset-0 z-50 overflow-hidden rounded-[2.5rem]" style={{ pointerEvents: isOpened ? 'none' : 'auto' }}>
              <div className="w-full h-full relative flex items-center justify-center">
                <AnimatePresence>
                  {!isCodeFading && !isOpened && (
                    <motion.div 
                      key="visual-trigger"
                      initial={{ opacity: 1, scale: 1 }}
                      exit={invitation.container_open === 'metal_door' ? {} : { opacity: 0, scale: 0.9, transition: { duration: 0.35 } }}
                      className="absolute inset-0 z-[70] flex flex-col items-center justify-center cursor-pointer" 
                      onClick={handleHandleClick}
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
                            className="w-48 h-48 select-none flex items-center justify-center"
                          >
                            <img 
                              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/main-qui-toque.PNG" 
                              className="w-full h-full object-contain drop-shadow-2xl" 
                              alt="Main qui toque" 
                            />
                          </motion.div>
                        ) : invitation.opening_style === 'key' ? (
                            <div className="select-none flex items-center justify-center relative w-[220px] h-[220px]">
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
                          <div className="relative w-[200px] h-[300px] flex flex-col items-center justify-start bg-neutral-950 border-[4px] border-neutral-800 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden p-4">
                            <img 
                              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/dgital.png" 
                              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none" 
                              alt="" 
                            />
                            <div className="w-full h-14 bg-black/95 rounded-xl border border-neutral-800 p-2 flex flex-col items-center justify-center shadow-inner relative z-10 mb-4">
                              <span className="text-[6.5px] font-mono tracking-[0.25em] text-neutral-400 font-bold uppercase mb-0.5">🔒 Invit Studio</span>
                              <div className="flex gap-1">
                                {displayedCode.map((digit, index) => (
                                  <motion.span
                                    key={index}
                                    initial={{ scale: 1.3 }}
                                    animate={{ scale: 1 }}
                                    className="text-sky-500 font-mono text-base font-black drop-shadow-[0_0_8px_rgba(14,165,233,0.8)] tracking-wider"
                                  >
                                    {digit}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 w-full max-w-[140px] relative z-10">
                              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => {
                                const isGlowing = activeKey === key;
                                return (
                                  <motion.div
                                    key={key}
                                    animate={isGlowing ? {
                                      backgroundColor: 'rgba(14, 165, 233, 0.35)',
                                      borderColor: '#38bdf8',
                                      boxShadow: '0 0 8px rgba(56, 189, 248, 0.7)',
                                      scale: 0.95
                                    } : {
                                      backgroundColor: 'rgba(23, 23, 23, 0.85)',
                                      borderColor: 'rgba(63, 63, 70, 0.2)',
                                      scale: 1
                                    }}
                                    className="w-full aspect-square flex items-center justify-center rounded-md border font-mono font-bold text-xs text-neutral-400 transition-all select-none"
                                  >
                                    <span className={isGlowing ? "text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.9)]" : ""}>
                                      {key}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                            <div className="mt-3 font-mono text-[7px] tracking-widest text-neutral-500 animate-pulse uppercase">
                              {isVaultClicked ? "CRACKING CODE..." : "Tap Device to Unlock"}
                            </div>
                          </div>
                        ) : (
                          <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-[24rem] h-[24rem] object-contain drop-shadow-xl" alt="Sceau" />
                        )}
                      </div>
                      
                      <p className="absolute bottom-6 text-white font-black text-[9px] uppercase tracking-[0.25em] animate-pulse text-center w-full px-4 drop-shadow-md">
                        {lang === 'fr' ? "Appuyez pour ouvrir l'invitation" : lang === 'en' ? "Tap to open invitation" : "Nhấn de mở lời mời"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SYSTÈME DE PORTES ET DE GRAND VOLET EN PLEIN ÉCRAN ASSORTIS (z-index MAXIMUM z-[55]) */}
            <div className="absolute inset-0 z-[55] w-full h-full flex pointer-events-none" style={{ perspective: '2000px' }}>
              {invitation.container_open === 'metal_door' ? (
                <motion.div 
                  animate={isOpened ? { x: "100%" } : { x: "0%" }}
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full bg-cover bg-center shadow-2xl pointer-events-auto"
                  style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20en%20metal.png")` }}
                />
              ) : invitation.container_open === 'wooden_door' ? (
                <AnimatePresence>
                  {!isOpened && (
                    <div className="absolute inset-0 w-full h-full flex pointer-events-auto">
                      <motion.div 
                        exit={{ rotateY: -100, x: '-20%', opacity: 0 }} 
                        transition={{ duration: 1.2, ease: "easeInOut" }} 
                        className="w-1/2 h-full origin-left bg-cover bg-center shadow-2xl border-r border-black/10" 
                        style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20gauche.png")` }} 
                      />
                      <motion.div 
                        exit={{ rotateY: 100, x: '20%', opacity: 0 }} 
                        transition={{ duration: 1.2, ease: "easeInOut" }} 
                        className="w-1/2 h-full origin-right bg-cover bg-center shadow-2xl border-l border-black/10" 
                        style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20droite.png")` }} 
                      />
                    </div>
                  )}
                </AnimatePresence>
              ) : (
                /* LE GRAND VOLET INITIAL EN PLEIN ÉCRAN S'ÉJECTE VERS LE HAUT AU CLIC POUR RÉVÉLER L'ENVELOPPE */
                <AnimatePresence>
                  {!isOpened && (
                    <motion.div 
                      exit={{ y: "-100%", opacity: 0 }} 
                      transition={{ duration: 0.85, ease: "easeIn" }} 
                      style={{ backgroundColor: invitation?.envelope_color || '#FFFFFF' }}
                      className="absolute inset-0 w-full h-full shadow-2xl rounded-[3.5rem] pointer-events-auto"
                    />
                  )}
                </AnimatePresence>
              )}
            </div>

          </motion.div>
        ) : (
          /* --- PANNEAU DE CONTENU DU FAIRE-PART --- */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ backgroundColor: invitation.paper_color || '#FFFFFF' }} className={`w-full h-full z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
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