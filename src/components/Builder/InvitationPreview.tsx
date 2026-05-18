import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle2, Plus, Clock, Sparkles, Film, Volume2, VolumeX } from 'lucide-react'; 
import { supabase } from '../../lib/supabase';
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
  const [guestCount, setGuestCount] = useState(1);
  const [guests, setGuests] = useState([{ firstName: '', lastName: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
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

  useEffect(() => {
    const newGuests = Array.from({ length: guestCount }, (_, i) => 
      guests[i] || { firstName: '', lastName: '' }
    );
    setGuests(newGuests);
  }, [guestCount]);

  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, invitation?.music_url]);

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

  const addToCalendar = () => {
    const eventDate = new Date(invitation.event_date);
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const startDate = formatDate(eventDate);
    const endDate = formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000));
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(invitation.title)}&dates=${startDate}/${endDate}&location=${encodeURIComponent(invitation.event_address)}&details=${encodeURIComponent(invitation.description || "")}`;
    window.open(googleUrl, '_blank');
  };

  const openMaps = () => {
    const address = encodeURIComponent(invitation.event_address);
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('responses').insert([{
          invitation_id: invitation.id,
          group_leader_name: `${guests[0].firstName} ${guests[0].lastName}`,
          guest_details: guests,
          total_guests: guestCount
      }]);
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) { console.error(err); } 
    finally { setIsSubmitting(false); }
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden touch-none bg-white" style={{ fontFamily: invitation.font_style || 'inherit' }}>
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

            {/* --- ARRIÈRE-PLAN : DÉCORS PREMIUM INDÉPENDANTS --- */}
            {isEnvelopeContainer && invitation.envelope_decor === 'balloons' && (
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/ballons.png" className="w-full h-full object-contain transform -translate-y-12 select-none" alt="Ballons" />
              </div>
            )}

            {isEnvelopeContainer && invitation.envelope_decor === 'floral' && (
              <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden mix-blend-screen">
                <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/flower.png" className="w-full h-full object-cover scale-105 pointer-events-none select-none" alt="Fleurs" />
              </div>
            )}

            {/* --- CORPS DE L'ENVELOPPE PARENT D'ORIGINE --- */}
            {isEnvelopeContainer && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <div 
                  className="w-full h-full bg-contain bg-center bg-no-repeat relative"
                  style={{ 
                    backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/enveloppe.png")`,
                    backgroundColor: invitation.envelope_color || '#FFFFFF',
                    mixBlendMode: 'multiply'
                  }}
                >
                  {/* RABAT DE L'ENVELOPPE (VUE STATIQUE) */}
                  <motion.div 
                    initial={{ rotateX: 0 }}
                    animate={isOpened ? { rotateX: -180, z: 10 } : { rotateX: 0 }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                    style={{ 
                      originY: 0,
                      backgroundColor: invitation.envelope_color || '#FFFFFF',
                      clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)'
                    }}
                    className="absolute inset-x-0 top-0 h-full bg-cover shadow-inner pointer-events-auto"
                  />
                </div>
              </div>
            )}

            {/* --- CONTENU ANIMÉ MULTIMÉDIA DU PROJET --- */}
            {isEnvelopeContainer && (
              <motion.div 
                initial={{ y: 200 }} 
                animate={isOpened ? { y: invitation.opening_type === 'filmstrip' ? -35 : 25 } : { y: 200 }} 
                transition={{ type: "spring", damping: 25, delay: 0.2 }} 
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
            )}

            {/* --- CARTE DU FAIRE-PART TRADITIONNEL --- */}
            <motion.div 
              initial={{ scale: 0.8, y: isEnvelopeContainer ? 220 : 0 }} 
              animate={isOpened ? { scale: 1, y: isEnvelopeContainer ? 135 : 80 } : { y: isEnvelopeContainer ? 220 : 0 }} 
              transition={{ type: "spring", damping: 20, delay: 0.4 }} 
              onClick={() => isOpened && setView('content')} 
              style={{ 
                backgroundColor: invitation.paper_color || '#FFFFFF',
                fontFamily: invitation.font_style 
              }}
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

            {/* --- INTERFACE TACTILE DE SURFACE INITIALE POUR LE CODE OU LE SCEAU --- */}
            <div className="absolute inset-0 z-40 overflow-hidden" style={{ perspective: '2000px', pointerEvents: isOpened ? 'none' : 'auto' }}>
              <div className="w-full h-full relative flex items-center justify-center">
                <AnimatePresence>
                  {!isCodeFading && !isOpened && (
                    <motion.div 
                      key="visual-trigger"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
                      className="absolute inset-0 z-[42] flex flex-col items-center justify-center cursor-pointer" 
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
                            <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/main-qui-toque.PNG" className="w-full h-full object-contain drop-shadow-2xl" alt="Main qui toque" />
                          </motion.div>
                        ) : invitation.opening_style === 'key' ? (
                            <div className="select-none flex items-center justify-center relative w-[260px] h-[260px]">
                              <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/cleserrure.png" className="absolute w-full h-full object-contain" alt="Serrure" />
                              <motion.img
                                src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/cleserrure.png" 
                                animate={{ rotate: [0, 45, 0, 45, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
                                className="absolute w-full h-full object-contain origin-center"
                                alt="Clé"
                              />
                            </div>
                        ) : invitation.opening_style === 'vault' ? (
                          <div className="relative w-[220px] h-[330px] flex flex-col items-center justify-start bg-neutral-950 border-[4px] border-neutral-800 rounded-[1.75rem] shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden p-4">
                            <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/dgital.png" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none" alt="" />
                            <div className="w-full h-16 bg-black/95 rounded-xl border border-neutral-800 p-2 flex flex-col items-center justify-center shadow-inner relative z-10 mb-5">
                              <span className="text-[7.5px] font-mono tracking-[0.25em] text-neutral-400 font-bold uppercase mb-0.5">🔒 Invit Studio</span>
                              <div className="flex gap-1">
                                {displayedCode.map((digit, index) => (
                                  <motion.span key={index} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-sky-500 font-mono text-xl font-black drop-shadow-[0_0_8px_rgba(14,165,233,0.8)] tracking-wider">
                                    {digit}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 w-full max-w-[155px] relative z-10">
                              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                                <div key={key} className="aspect-square flex items-center justify-center rounded-lg border border-zinc-800 font-mono text-sm text-neutral-400">{key}</div>
                              ))}
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
              </div>
            </div>

            {/* ========================================================================= */}
            {/* COUCHE 5 : LES SYSTEMES D'OUVERTURE PLEIN ÉCRAN (PORTES EN BOIS / PORTE MÉTAL / GRAND VOLET) */}
            {/* ========================================================================= */}
            <div className="absolute inset-0 z-50 w-full h-full flex pointer-events-none" style={{ perspective: '2000px' }}>
              <AnimatePresence>
                {!isOpened && (
                  <>
                    {invitation.container_open === 'metal_door' ? (
                      <motion.div 
                        key="metal-door"
                        exit={{ x: "100%" }}
                        transition={{ duration: 1.6, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full bg-cover bg-center shadow-2xl pointer-events-auto"
                        style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20en%20metal.png")` }}
                      />
                    ) : invitation.container_open === 'wooden_door' ? (
                      <div key="wooden-door" className="absolute inset-0 w-full h-full flex pointer-events-auto">
                        <motion.div 
                          exit={{ rotateY: -100, x: '-20%', opacity: 0 }} 
                          transition={{ duration: 1.2, ease: "easeInOut" }} 
                          className="w-1/2 h-full origin-left bg-cover bg-center shadow-2xl border-r border-black/10 pointer-events-auto" 
                          style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20gauche.png")` }} 
                        />
                        <motion.div 
                          exit={{ rotateY: 100, x: '20%', opacity: 0 }} 
                          transition={{ duration: 1.2, ease: "easeInOut" }} 
                          className="w-1/2 h-full origin-right bg-cover bg-center shadow-2xl border-l border-black/10 pointer-events-auto" 
                          style={{ backgroundImage: `url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20droite.png")` }} 
                        />
                      </div>
                    ) : (
                      <motion.div 
                        key="shutter-shutter"
                        exit={{ y: "-100%", opacity: 0 }} 
                        transition={{ duration: 0.85, ease: "easeIn" }} 
                        style={{ backgroundColor: invitation?.envelope_color || '#FFFFFF' }}
                        className="absolute inset-0 w-full h-full shadow-2xl rounded-[3.5rem] pointer-events-auto"
                      />
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        ) : (
          /* --- PANNEAU DE CONTENU DU RSVP --- */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ backgroundColor: invitation.paper_color || '#FFFFFF' }} className={`w-full h-full z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="h-[30%] relative overflow-hidden shrink-0">
               <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ transform: `translate(${invitation.main_photo_url_pos_x || 0}px, ${invitation.main_photo_url_pos_y || 0}px) scale(${invitation.main_photo_url_scale || 1})` }} />
               <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
               <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md"><X size={20}/></button>
            </div>
            <div className="flex-1 p-8 space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-black mb-4 leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation?.host_names || tBuilder.hosts_placeholder}</h2>
                <div className="flex flex-col items-center gap-2 opacity-60 font-bold text-[10px] uppercase tracking-widest text-gray-700">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-amber-500"/> {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {day:'numeric', month:'long', year:'numeric'}) : t.save_date}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-amber-500"/> {invitation.event_address || tBuilder.address_placeholder}</div>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                   <button onClick={addToCalendar} className="p-3 bg-amber-50 rounded-full shadow-sm"><Calendar size={18} className="text-amber-600" /></button>
                   <button onClick={openMaps} className="p-3 bg-amber-50 rounded-full shadow-sm"><MapPin size={18} className="text-amber-600" /></button>
                </div>
              </div>

              {invitation.description && (
                <div className="text-center italic opacity-80" style={{ fontFamily: invitation.font_style }}>
                  <p className="text-[13px] leading-relaxed px-4 whitespace-pre-wrap">{invitation.description}</p>
                  <div className="w-12 h-[1px] bg-amber-200 mx-auto mt-6" />
                </div>
              )}

              <div className="space-y-12">
                <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-2">
                   <Sparkles size={12}/> {tBuilder.program_title} <Sparkles size={12}/>
                </h3>
                <div className="relative flex flex-col items-center">
                  <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 3.0 }} className="absolute top-0 w-[2px] h-full bg-gradient-to-b from-amber-100 via-amber-500 to-amber-100 origin-top" />
                  <div className="relative space-y-12 w-full">
                    {(invitation.event_program || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: isEven ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1.2 }} className={`flex items-center w-full relative ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className="w-[45%]">
                            <div className={`overflow-hidden bg-white/60 rounded-2xl border border-amber-50 shadow-lg ${isEven ? 'text-right' : 'text-left'}`}>
                              {step.image_url && <img src={step.image_url} className="w-full aspect-video object-cover" alt="" />}
                              <div className="p-4">
                                <div className={`text-[9px] font-black text-amber-600 mb-1 flex items-center gap-1 ${isEven ? 'justify-start' : 'justify-end'}`}><Clock size={8}/> {step.time}</div>
                                <div className="text-[11px] font-bold uppercase tracking-tight leading-tight" style={{ fontFamily: invitation.font_style }}>{step.activity}</div>
                              </div>
                            </div>
                          </div>
                          <div className="w-[10%] flex justify-center"><div className="w-3 h-3 bg-amber-500 rounded-full ring-4 ring-white shadow-sm z-10" /></div>
                          <div className="w-[45%]" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {invitation.plan_type === 'PREMIUM' && invitation.end_photo_url && (
                <div className="px-2">
                  <div className="rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white rotate-1">
                    <img src={invitation.end_photo_url} className="w-full h-auto" style={{ transform: `translate(${invitation.end_photo_url_pos_x || 0}px, ${invitation.end_photo_url_pos_y || 0}px) scale(${invitation.end_photo_url_scale || 1})` }} />
                  </div>
                </div>
              )}

              <div className="bg-gray-900 rounded-[3rem] p-8 shadow-2xl">
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-xs text-white text-center">{t.confirm_rsvp}</h3>
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-12 h-12 bg-white/10 text-white rounded-xl font-black">-</button>
                      <span className="text-white font-black text-2xl">{guestCount}</span>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-12 h-12 bg-white/10 text-white rounded-xl font-black">+</button>
                    </div>
                    {guests.map((guest, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3">
                        <input required placeholder={t.first_name} className="bg-white/10 h-12 px-4 rounded-xl text-sm text-white focus:ring-1 ring-amber-400 outline-none" value={guest.firstName} onChange={e => { const n = [...guests]; n[i].firstName = e.target.value; setGuests(n); }} />
                        <input required placeholder={t.last_name} className="bg-white/10 h-12 px-4 rounded-xl text-sm text-white focus:ring-1 ring-amber-400 outline-none" value={guest.lastName} onChange={e => { const n = [...guests]; n[i].lastName = e.target.value; setGuests(n); }} />
                      </div>
                    ))}
                    <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-white text-gray-900 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                      {isSubmitting ? "..." : t.send}
                    </button>
                  </form>
                ) : (
                  <div className="py-6 text-center space-y-4">
                    <CheckCircle2 size={40} className="text-amber-400 mx-auto" />
                    <p className="text-white font-black uppercase text-sm">{t.thank_you}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}