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

  // Système audio natif et hybride (fichiers locaux .wav + synthétiseur)
  const playSyntheticSound = (type: 'beep' | 'lock' | 'key' | 'open_door') => {
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
      }
    } catch (e) {
      console.error("Le système audio n'a pas pu s'initialiser", e);
    }
  };

  // Synchronisation du son réel uniquement sur le début exact de la boucle de la Clé
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

  // Extraction et formatage de la date choisie pour le code secret (Ex: 24 Juin = "2406")
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

  // LOGIQUE DE DÉFILEMENT DE 6 CHIFFRES : Gère l'attente infinie ET la fixation après clic
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
          setIsCodeFading(true); // Lance le fondu sortant du boîtier numérique
          
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

  // Centralisation et exécution de l'ouverture
  const triggerContainerOpening = () => {
    if (invitation.container_open === 'wooden_door') {
      playSyntheticSound('open_door');
    }
    setIsOpened(true);
    audioRef.current?.play().catch(() => {});
  };

  // Déclencheur au clic/toucher de l'interface
  const handleTriggerClick = () => {
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
      <div className="absolute inset-0 z-[14] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span key={p.id} initial={{ y: -50, opacity: 0 }} animate={{ y: 800, opacity: [0, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
            className="absolute text-3xl" style={{ left: p.left }}>{p.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  /* --- COMPOSANT DÉCORS ET ANIMATIONS CORRIGÉES ET STRUCTURÉES (PREMIUM) --- */
  const AutonomousDecor = () => {
    const theme = invitation.background_theme;

    const ballons = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: `${15 + (i * 14) + Math.random() * 4}%`,
      delay: i * 0.5,
      duration: 6 + Math.random() * 3
    })), []);

    const papillons = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: `${10 + Math.random() * 70}%`,
      top: `${15 + Math.random() * 50}%`,
      duration: 6 + Math.random() * 4,
      delay: i * 0.4,
      type: i % 2 === 0 ? 'pap1' : 'pap2'
    })), []);

    const etoilesPluie = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${8 + (i * 6)}%`,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 1.5,
      targetY: 575 + (Math.random() * 15)
    })), []);

    return (
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
        {/* THÈME FLOWERS : Rendu exclusif */}
        {theme === 'flowers' && (
          <>
            <div 
              className="absolute top-0 right-0 w-40 h-40 bg-contain bg-no-repeat bg-right-top z-20" 
              style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/fleurs%20haut%20droite.png")` }} 
            />
            <div 
              className="absolute bottom-0 left-0 w-40 h-40 bg-contain bg-no-repeat bg-left-bottom z-20" 
              style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/fleurs%20bas%20gauche.png")` }} 
            />
          </>
        )}

        {/* THÈME BALLOONS : Rendu exclusif */}
        {theme === 'balloons' && ballons.map((b) => (
          <motion.img 
            key={`ballon-${b.id}`}
            src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/ballons.png"
            initial={{ y: 680, opacity: 0 }} 
            animate={{ y: -120, opacity: [0, 1, 1, 0] }}
            transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: "linear" }}
            className="absolute w-10 h-auto" 
            style={{ left: b.left }}
          />
        ))}

        {/* THÈME BUTTERFLIES : Vol autonome dispersé sur l'écran et battement d'ailes */}
        {theme === 'butterflies' && papillons.map((p) => (
          <motion.div
            key={`pap-container-${p.id}`}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ 
              x: [0, p.id % 2 === 0 ? 120 : -120, p.id % 2 === 0 ? -80 : 80, 0], 
              y: [0, -140, 50, 0],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
            className="absolute"
            style={{ left: p.left, top: p.top }}
          >
            <motion.img 
              src={p.type === 'pap1' ? "https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/papillions.png" : "https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/papillion%202.png"}
              animate={{ scaleX: [1, -1, 1] }}
              transition={{ duration: 0.25, repeat: Infinity, ease: "linear" }}
              className="w-8 h-auto origin-center"
            />
          </motion.div>
        ))}

        {/* THÈME STARS : Rendu exclusif avec accumulation au sol */}
        {theme === 'stars' && etoilesPluie.map((e) => (
          <motion.img 
            key={`etoile-${e.id}`}
            src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/etoile.png"
            initial={{ y: -20, opacity: 0 }}
            animate={{ 
              y: [0, e.targetY, e.targetY], 
              opacity: [0, 1, 1, 0],
              scale: [1, 1, 0.85]
            }}
            transition={{ duration: e.duration, times: [0, 0.75, 1], repeat: Infinity, delay: e.delay }}
            className="absolute w-4 h-auto drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" 
            style={{ left: e.left }}
          />
        ))}
      </div>
    );
  };

  const isDoorType = invitation.container_open === 'wooden_door' || invitation.container_open === 'metal_door';

  const showEmojiRain = isOpened && (invitation.plan_type !== 'PREMIUM' || invitation.premium_trigger_type === 'emoji' || !invitation.premium_trigger_type);
  const showPremiumDecor = isOpened && invitation.plan_type === 'PREMIUM' && invitation.premium_trigger_type === 'decor';

  return (
    <div className="relative w-full h-full max-h-[650px] flex items-center justify-center overflow-hidden bg-white rounded-[3.5rem] shadow-2xl border-[12px] border-gray-50/50" style={{ fontFamily: invitation.font_style || 'inherit' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      
      {/* Pluie d'émojis standard pour les comptes FREE ou si le switch PREMIUM est réglé sur 'emoji' */}
      {showEmojiRain && <EmojiRain />}
      
      {/* Décors animés avancés exclusifs rendus uniquement pour les comptes PREMIUM en mode 'decor' */}
      {showPremiumDecor && <AutonomousDecor />}
      
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
                /* --- VINYLE MODERNISÉ AVEC BRAS SVG ANIMÉ --- */
                <div className="relative w-[280px] h-[280px] flex items-center justify-center" style={{ perspective: '1000px' }}>
                  <motion.div 
                    initial={{ rotateX: 15, rotateZ: 0 }}
                    animate={isOpened ? { rotateZ: 360 } : { rotateZ: 0 }}
                    transition={isOpened ? { repeat: Infinity, duration: 4, ease: "linear", delay: 0.8 } : { duration: 0.5 }}
                    className="w-[250px] h-[250px] relative rounded-full bg-neutral-950 shadow-[0_15px_35px_rgba(0,0,0,0.6),_inset_0_0_20px_rgba(255,255,255,0.05)] border-4 border-neutral-900 flex items-center justify-center overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none" style={{ background: 'repeating-radial-gradient(circle, #555 0px, #000 2px, #111 4px)' }} />
                    <motion.div 
                      animate={isOpened ? { rotate: -360 } : { rotate: 0 }}
                      transition={isOpened ? { repeat: Infinity, duration: 4, ease: "linear", delay: 0.8 } : { duration: 0.5 }}
                      className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
                      style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.4) 60deg, transparent 120deg, transparent 180deg, rgba(255,255,255,0.4) 240deg, transparent 300deg)' }}
                    />
                    <div className="w-24 h-24 bg-white rounded-full border-[6px] border-neutral-950 shadow-md overflow-hidden relative z-10 flex items-center justify-center">
                      {invitation.main_photo_url ? (
                        <img src={invitation.main_photo_url} className="w-full h-full object-cover" 
                          style={{ transform: `translate(${invitation.main_photo_url_pos_x || 0}px, ${invitation.main_photo_url_pos_y || 0}px) scale(${invitation.main_photo_url_scale || 1})` }} alt="" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-neutral-200 to-neutral-50" />
                      )}
                      <div className="absolute w-3 h-3 bg-neutral-950 rounded-full shadow-inner border border-white/20" />
                    </div>
                  </motion.div>

                  <div className="absolute top-[-10px] right-[-10px] w-28 h-36 z-30 pointer-events-none">
                    <svg className="w-full h-full drop-shadow-[4px_8px_10px_rgba(0,0,0,0.5)]" viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="75" cy="25" r="12" fill="#262626" stroke="#404040" strokeWidth="2"/>
                      <circle cx="75" cy="25" r="5" fill="#171717"/>
                      <motion.g
                        initial={{ rotate: -35 }}
                        animate={isOpened ? { rotate: 5 } : { rotate: -35 }}
                        transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.2 }}
                        style={{ transformOrigin: "75px 25px" }}
                      >
                        <path d="M 75 25 L 68 85 L 35 110" stroke="#d4d4d8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 75 25 L 68 85 L 35 110" stroke="#a1a1aa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="70" y="5" width="10" height="12" rx="2" fill="#525252" />
                        <g transform="translate(35, 110) rotate(-35)">
                          <rect x="-6" y="-3" width="12" height="16" rx="2" fill="#171717" />
                          <rect x="-4" y="2" width="8" height="10" rx="1" fill="#e5e5e5" />
                          <circle cx="0" cy="10" r="1.5" fill="#f59e0b" />
                        </g>
                      </motion.g>
                    </svg>
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

            {/* --- COUCHE DECLENCHEURS MECANIQUES ET ENVELOPPES PROPRES --- */}
            <div className="absolute inset-0 z-50 overflow-hidden" style={{ perspective: '2500px', pointerEvents: isOpened ? 'none' : 'auto' }}>
              <AnimatePresence>
                {(!isOpened || invitation.container_open === 'metal_door') && (
                  <motion.div 
                    key="gate-container" 
                    exit={invitation.container_open === 'metal_door' ? { opacity: 1 } : { opacity: 1 }}
                    className="w-full h-full relative flex items-center justify-center"
                  >
                    <AnimatePresence>
                      {!isCodeFading && (
                        <motion.div 
                          key="visual-trigger"
                          initial={{ opacity: 1 }}
                          exit={{ 
                            opacity: 0, 
                            transition: { duration: 0.4, ease: "easeInOut" } 
                          }}
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
                              /* --- BOITIER DIGITAL TACTILE --- */
                              <div className="relative w-[220px] h-[330px] flex flex-col items-center justify-start bg-neutral-950 border-[4px] border-neutral-800 rounded-[1.75rem] shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden p-4">
                                <img 
                                  src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/dgital.png" 
                                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none" 
                                  alt="" 
                                />

                                {/* Écran LCD Supérieur */}
                                <div className="w-full h-16 bg-black/95 rounded-xl border border-neutral-800 p-2 flex flex-col items-center justify-center shadow-inner relative z-10 mb-5">
                                  <span className="text-[7.5px] font-mono tracking-[0.25em] text-neutral-400 font-bold uppercase mb-0.5">🔒 Invit Studio</span>
                                  <div className="flex gap-1">
                                    {displayedCode.map((digit, index) => (
                                      <motion.span
                                        key={index}
                                        initial={{ scale: 1.3 }}
                                        animate={{ scale: 1 }}
                                        className="text-sky-500 font-mono text-xl font-black drop-shadow-[0_0_8px_rgba(14,165,233,0.8)] tracking-wider"
                                      >
                                        {digit}
                                      </motion.span>
                                    ))}
                                  </div>
                                </div>

                                {/* Clavier Rétroéclairé Bleu */}
                                <div className="grid grid-cols-3 gap-2 w-full max-w-[155px] relative z-10">
                                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => {
                                    const isGlowing = activeKey === key;
                                    return (
                                      <motion.div
                                        key={key}
                                        animate={isGlowing ? {
                                          backgroundColor: 'rgba(14, 165, 233, 0.35)',
                                          borderColor: '#38bdf8',
                                          boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
                                          scale: 0.95
                                        } : {
                                          backgroundColor: 'rgba(23, 23, 23, 0.85)',
                                          borderColor: 'rgba(63, 63, 70, 0.2)',
                                          boxShadow: 'none',
                                          scale: 1
                                        }}
                                        className="aspect-square flex items-center justify-center rounded-lg border font-mono font-bold text-sm text-neutral-400 transition-all select-none"
                                      >
                                        <span className={isGlowing ? "text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.9)]" : ""}>
                                          {key}
                                        </span>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                                <div className="w-full mt-3.5 font-mono text-[8px] tracking-widest text-neutral-500 animate-pulse uppercase text-center">
                                  {isVaultClicked ? "CRACKING CODE..." : "Tap Device to Unlock"}
                                </div>
                              </div>
                            ) : (
                              /* --- RENDU DU SCEAU COMMUNE --- */
                              <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-[32rem] h-[32rem] object-contain" alt="Sceau" />
                            )}
                          </div>
                          
                          <p className="absolute bottom-12 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse text-center w-full px-4">
                            {lang === 'fr' ? "Appuyez pour ouvrir l'invitation" : lang === 'en' ? "Tap to open invitation" : "Nhấn de mở lời mời"}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* INTERFACE DE RECOUVREMENT DE L'ENVELOPPE (FREE / PREMIUM) */}
                    <div className="absolute inset-0 z-50 w-full h-full flex" style={{ perspective: '2500px', transformStyle: 'preserve-3d' }}>
                      {invitation.container_open === 'metal_door' ? (
                        /* PREMIUM : Porte métallique coulissant horizontalement à droite */
                        <motion.div 
                          animate={isOpened ? { x: "100%" } : { x: "0%" }}
                          transition={{ duration: 1.6, ease: "easeInOut" }}
                          className="absolute inset-0 w-full h-full bg-cover bg-center shadow-2xl"
                          style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20noir.png")` }}
                        />
                      ) : invitation.container_open === 'wooden_door' ? (
                        /* PREMIUM : Double porte en bois s'ouvrant en 3D vers l'intérieur (Axe fixés sur les bords gauches et droits) */
                        <AnimatePresence>
                          {!isOpened && (
                            <>
                              <motion.div 
                                exit={{ rotateY: -95, opacity: 0 }} 
                                transition={{ duration: 1.4, ease: "easeInOut" }} 
                                className="w-1/2 h-full origin-left bg-cover bg-center shadow-[15px_0_30px_rgba(0,0,0,0.5)] border-r border-black/10 animate-preserve-3d" 
                                style={{ 
                                  backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20gauche.png")`, 
                                  backgroundColor: invitation?.envelope_color || '#FEE2E2'
                                }} 
                              />
                              <motion.div 
                                exit={{ rotateY: 95, opacity: 0 }} 
                                transition={{ duration: 1.4, ease: "easeInOut" }} 
                                className="w-1/2 h-full origin-right bg-cover bg-center shadow-[-15px_0_30px_rgba(0,0,0,0.5)] border-l border-black/10 animate-preserve-3d" 
                                style={{ 
                                  backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20droite.png")`, 
                                  backgroundColor: invitation?.envelope_color || '#FEE2E2'
                                }} 
                              />
                            </>
                          )}
                        </AnimatePresence>
                      ) : (
                        /* FREE PAR DÉFAUT : Volet uni qui change de couleur et qui monte verticalement */
                        <AnimatePresence>
                          {!isOpened && (
                            <motion.div 
                              key="free-gate-panel"
                              initial={{ y: "0%" }}
                              exit={{ y: "-100%" }}
                              transition={{ duration: 1.3, ease: [0.43, 0.13, 0.23, 0.96] }}
                              className="absolute inset-0 w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-b border-black/10" 
                              style={{ backgroundColor: invitation?.envelope_color || '#FEE2E2' }} 
                            />
                          )}
                        </AnimatePresence>
                      )}
                    </div>
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
                          <motion.div initial={{ scale: 0, rotate: 45 }} whileInView={{ scale: 1, rotate: 45 }} viewport={{ once: true }} className={`absolute top-1/2 -translate-y-1/2 z-20 w-3 h-3 bg-amber-500 border border-white shadow-md ${isEven ? 'right-[50%] translate-x-1/2' : 'left-[50%]' -translate-x-1/2}`}>
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