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

const pick = (obj: any, keys: string[], fallback: any = undefined) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') return obj[key];
  }
  return fallback;
};

export function InvitationPreview({ invitation }: any) {
  const [isOpened, setIsOpened] = useState(false);
  const [view, setView] = useState<'envelope' | 'content'>('envelope');
  const [isMuted, setIsMuted] = useState(false);
  const [isVaultClicked, setIsVaultClicked] = useState(false);
  const [displayedCode, setDisplayedCode] = useState(['*', '*', '*', '*', '*', '*']);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isCodeFading, setIsCodeFading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const lang = (pick(invitation, ['language']) as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].guest;
  const tBuilder = translations[lang].builder;

  const paperType = pick(invitation, ['paper_type', 'papertype'], 'smooth');
  const openingStyle = pick(invitation, ['opening_style', 'openingstyle'], 'default');
  const openingType = pick(invitation, ['opening_type', 'openingtype'], 'vinyl');
  const containerOpen = pick(invitation, ['container_open', 'containeropen'], 'envelope');
  const backgroundTheme = pick(invitation, ['background_theme', 'backgroundtheme'], '');
  const planType = pick(invitation, ['plan_type', 'plantype'], 'FREE');
  const premiumTriggerType = pick(invitation, ['premium_trigger_type', 'premiumtriggertype'], null);

  const fontStyle = pick(invitation, ['font_style', 'fontstyle'], 'inherit');
  const paperColor = pick(invitation, ['paper_color', 'papercolor'], '#ffffff');
  const envelopeColor = pick(invitation, ['envelope_color', 'envelopecolor'], '#FEE2E2');
  const backgroundColor = pick(invitation, ['background_color', 'backgroundcolor'], '');

  const title = pick(invitation, ['title'], '');
  const hostNames = pick(invitation, ['host_names', 'hostnames'], '');
  const description = pick(invitation, ['description'], '');
  const mainPhotoUrl = pick(invitation, ['main_photo_url', 'mainphotourl'], '');
  const musicUrl = pick(invitation, ['music_url', 'musicurl'], '');
  const eventDate = pick(invitation, ['event_date', 'eventdate'], '');
  const eventAddress = pick(invitation, ['event_address', 'eventaddress'], '');
  const vaultDate = pick(invitation, ['vault_date', 'vaultdate'], '');
  const endPhotoUrl = pick(invitation, ['end_photo_url', 'endphotourl'], '');
  const eventProgram = pick(invitation, ['event_program', 'eventprogram'], []);
  const photoUrl2 = pick(invitation, ['photo_url_2', 'photourl2'], '');
  const photoUrl3 = pick(invitation, ['photo_url_3', 'photourl3'], '');

  const isPremium = planType === 'PREMIUM';
  const isPremiumDecor = isPremium && premiumTriggerType === 'decor';

  const effectivePaperType = isPremium || paperType === 'smooth' ? paperType : 'smooth';
  const cardPaperColor = isPremium ? paperColor : '#ffffff';
  const previewBackgroundColor = isPremiumDecor && backgroundColor ? backgroundColor : '#ffffff';

  const getPaperClass = () => {
    switch (effectivePaperType) {
      case 'parchment':
        return 'paper-parchment';
      case 'grainy':
        return 'paper-grainy';
      case 'cotton':
        return 'paper-cotton';
      case 'silk':
        return 'paper-silk';
      case 'velvet':
        return 'paper-velvet';
      default:
        return 'paper-smooth';
    }
  };

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
          console.error('Impossible de lire le fichier .wav :', path, err);
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

  useEffect(() => {
    if (isOpened || isCodeFading) return;

    let loopInterval: NodeJS.Timeout | undefined;

    if (openingStyle === 'key') {
      playSyntheticSound('key');
      loopInterval = setInterval(() => {
        playSyntheticSound('key');
      }, 2500);
    }

    return () => {
      if (loopInterval) clearInterval(loopInterval);
    };
  }, [isOpened, isCodeFading, openingStyle, isMuted]);

  const targetCode = useMemo(() => {
    const dateSource = vaultDate || eventDate;
    if (!dateSource) return '123456';

    const d = new Date(dateSource);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);

    return `${day}${month}${year}`;
  }, [vaultDate, eventDate]);

  useEffect(() => {
    if (isOpened && musicUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, musicUrl]);

  useEffect(() => {
    if (!isOpened && openingStyle === 'vault') {
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

        setActiveKey(String(Math.floor(Math.random() * 10)));
      }, 75);

      let digitLockTimers: NodeJS.Timeout[] = [];
      let endTimer: NodeJS.Timeout | undefined;

      if (isVaultClicked) {
        digitLockTimers = Array.from({ length: 6 }).map((_, index) =>
          setTimeout(() => {
            currentDigitIndex = index + 1;

            setDisplayedCode((prev) => {
              const next = [...prev];
              next[index] = targetCode[index];
              return next;
            });

            setActiveKey(targetCode[index]);
            playSyntheticSound('beep');
          }, (index + 1) * 550)
        );

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
  }, [isOpened, openingStyle, isVaultClicked, targetCode, containerOpen]);

  const triggerContainerOpening = () => {
    if (containerOpen === 'wooden_door') {
      playSyntheticSound('open_door');
    }

    setIsOpened(true);
    audioRef.current?.play().catch(() => {});
  };

  const handleTriggerClick = () => {
    if (openingStyle === 'vault') {
      if (!isVaultClicked) setIsVaultClicked(true);
    } else {
      setIsCodeFading(true);
      setTimeout(() => triggerContainerOpening(), 400);
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
    const particles = useMemo(
      () =>
        Array.from({ length: 25 }).map((_, i) => {
          const eventType = pick(invitation, ['event_type', 'eventtype'], '');
          const emojis = THEME_EMOJIS[eventType] || THEME_EMOJIS.default;

          return {
            id: i,
            emoji: emojis[i % emojis.length],
            left: `${i * 4 + Math.random() * 3}%`,
            delay: Math.random() * 2,
            duration: 4 + Math.random() * 2
          };
        }),
      [invitation]
    );

    return (
      <div className="absolute inset-0 z-[14] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 800, opacity: [0, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
            className="absolute text-3xl"
            style={{ left: p.left }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  const AutonomousDecor = () => {
    const theme = backgroundTheme;

    const ballons = useMemo(
      () =>
        Array.from({ length: 6 }).map((_, i) => ({
          id: i,
          left: `${15 + i * 14 + Math.random() * 4}%`,
          delay: i * 0.5,
          duration: 6 + Math.random() * 3
        })),
      []
    );

    const papillonsConfig = useMemo(
      () => [
        { id: 1, size: 0.85, flapSpeed: 0.2, duration: 7, initX: -50, initY: 100, pathX: [120, 240, 400], pathY: [80, 220, 150] },
        { id: 2, size: 0.5, flapSpeed: 0.16, duration: 5, initX: 420, initY: 200, pathX: [280, 140, -60], pathY: [250, 90, 180] },
        { id: 3, size: 0.7, flapSpeed: 0.24, duration: 8, initX: 180, initY: -60, pathX: [220, 100, 160], pathY: [150, 380, 700] },
        { id: 4, size: 0.6, flapSpeed: 0.18, duration: 6, initX: 250, initY: 680, pathX: [120, 300, 200], pathY: [480, 200, -60] },
        { id: 5, size: 0.9, flapSpeed: 0.22, duration: 7.5, initX: -50, initY: 450, pathX: [150, 80, 420], pathY: [350, 120, 50] },
        { id: 6, size: 0.45, flapSpeed: 0.14, duration: 4.5, initX: 420, initY: 400, pathX: [200, 310, -50], pathY: [300, 520, 380] }
      ],
      []
    );

    const etoilesPluie = useMemo(
      () =>
        Array.from({ length: 45 }).map((_, i) => ({
          id: i,
          left: `${2 + Math.random() * 96}%`,
          delay: Math.random() * 3.5,
          duration: 1.8 + Math.random() * 1.6,
          sizeClass: i % 2 === 0 ? 'w-3 h-auto' : 'w-1.5 h-auto',
          targetY: 582 + Math.random() * 20
        })),
      []
    );

    return (
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
        {theme === 'flowers' && (
          <>
            <div
              className="absolute -top-8 -right-8 w-56 h-56 bg-contain bg-no-repeat bg-right-top z-20"
              style={{
                backgroundImage: 'url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/fleurs%20haut%20droite.png")'
              }}
            />
            <div
              className="absolute -bottom-8 -left-8 w-56 h-56 bg-contain bg-no-repeat bg-left-bottom z-20"
              style={{
                backgroundImage: 'url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/fleurs%20bas%20gauche.png")'
              }}
            />
          </>
        )}

        {theme === 'balloons' &&
          ballons.map((b) => (
            <motion.img
              key={`ballon-${b.id}`}
              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/ballons.png"
              initial={{ y: 680, opacity: 0 }}
              animate={{ y: -120, opacity: [0, 1, 1, 0] }}
              transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: 'linear' }}
              className="absolute w-10 h-auto"
              style={{ left: b.left }}
              alt=""
            />
          ))}

        {theme === 'butterflies' &&
          isPremiumDecor &&
          papillonsConfig.map((p) => (
            <motion.div
              key={`pap-infinite-${p.id}`}
              initial={{ x: p.initX, y: p.initY, opacity: 0 }}
              animate={{ x: p.pathX, y: p.pathY, opacity: [0, 1, 1, 1, 0] }}
              transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
              className="absolute"
              style={{ scale: p.size }}
            >
              <motion.img
                src={
                  p.id % 2 === 0
                    ? 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/papillions.png'
                    : 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/papillion%202.png'
                }
                animate={{ scaleX: [1, -1, 1] }}
                transition={{ duration: p.flapSpeed, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-auto origin-center"
                alt=""
              />
            </motion.div>
          ))}

        {theme === 'stars' &&
          etoilesPluie.map((e) => (
            <motion.img
              key={`etoile-dense-${e.id}`}
              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/etoile.png"
              initial={{ y: -30, opacity: 0, scale: 0.6 }}
              animate={{
                y: [0, e.targetY, e.targetY],
                opacity: [0, 1, 1, 0.8, 0],
                scale: [0.8, 1, 1, 0.9, 0]
              }}
              transition={{
                duration: e.duration,
                times: [0, 0.65, 0.85, 0.95, 1],
                repeat: Infinity,
                delay: e.delay,
                ease: 'easeOut'
              }}
              className={`absolute ${e.sizeClass} drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]`}
              style={{ left: e.left }}
              alt=""
            />
          ))}
      </div>
    );
  };

  const showEmojiRain = isOpened && (planType !== 'PREMIUM' || premiumTriggerType === 'emoji' || !premiumTriggerType);
  const showPremiumDecor = isOpened && isPremiumDecor;

  const mainPhotoPosX = pick(invitation, ['main_photo_url_pos_x', 'mainphotourlposx'], 0);
  const mainPhotoPosY = pick(invitation, ['main_photo_url_pos_y', 'mainphotourlposy'], 0);
  const mainPhotoScale = pick(invitation, ['main_photo_url_scale', 'mainphotourlscale'], 1);

  return (
    <div
      className="relative w-full h-full max-h-[650px] flex items-center justify-center overflow-hidden rounded-[3.5rem] shadow-2xl border-[12px] border-gray-50/50"
      style={
        {
          fontFamily: fontStyle,
          background: previewBackgroundColor
        } as React.CSSProperties
      }
    >
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop />}

      {showEmojiRain && <EmojiRain />}
      {showPremiumDecor && <AutonomousDecor />}

      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
            {isOpened && musicUrl && (
              <button onClick={toggleMute} className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
              </button>
            )}

            <motion.div
              initial={{ y: -450 }}
              animate={isOpened ? { y: openingType === 'filmstrip' ? -35 : 25 } : { y: -450 }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute top-0 z-20"
            >
              {openingType === 'filmstrip' ? (
                <div className="relative w-44 h-72 bg-[#1a1a1a] rounded-xl shadow-2xl rotate-[-2deg] overflow-hidden p-2 border-y-4 border-[#1a1a1a]">
                  <div className="absolute inset-y-0 left-1.5 w-1.5 border-l-2 border-dashed border-white/20 z-10" />
                  <div className="absolute inset-y-0 right-1.5 w-1.5 border-r-2 border-dashed border-white/20 z-10" />

                  <motion.div animate={{ y: [0, -360] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="flex flex-col gap-2">
                    {[
                      { url: mainPhotoUrl, key: 'main_photo_url' },
                      { url: photoUrl2, key: 'photo_url_2' },
                      { url: photoUrl3, key: 'photo_url_3' },
                      { url: mainPhotoUrl, key: 'main_photo_url' },
                      { url: photoUrl2, key: 'photo_url_2' },
                      { url: photoUrl3, key: 'photo_url_3' }
                    ].map((imgObj, idx) => (
                      <div key={idx} className="w-full h-28 bg-[#222] rounded-sm overflow-hidden relative shrink-0">
                        {imgObj.url ? (
                          <img
                            src={imgObj.url}
                            className="w-full h-full object-cover grayscale-[0.2] contrast-125"
                            style={{
                              transform: `translate(${pick(invitation, [`${imgObj.key}_pos_x`, `${imgObj.key}posx`], 0)}px, ${pick(invitation, [`${imgObj.key}_pos_y`, `${imgObj.key}posy`], 0)}px) scale(${pick(invitation, [`${imgObj.key}_scale`, `${imgObj.key}scale`], 1)})`
                            }}
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Film className="text-gray-600" size={20} />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className="relative w-[300px] h-[300px] flex items-center justify-center" style={{ perspective: '1000px' }}>
                  <motion.div
                    initial={{ rotateX: 15, rotateZ: 0 }}
                    animate={isOpened ? { rotateZ: 360 } : { rotateZ: 0 }}
                    transition={isOpened ? { repeat: Infinity, duration: 7, ease: 'linear', delay: 0.8 } : { duration: 0.5 }}
                    className="w-[270px] h-[270px] relative rounded-full border border-neutral-950 overflow-hidden"
                    style={{
                      background: 'radial-gradient(circle at center, #050505 0 7%, #101010 8% 18%, #050505 19% 100%)',
                      boxShadow: '0 24px 60px rgba(0,0,0,0.75), inset 0 0 18px rgba(255,255,255,0.06), inset 0 0 80px rgba(0,0,0,0.95)'
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-75 pointer-events-none"
                      style={{
                        background: 'repeating-radial-gradient(circle, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 0.45px, transparent 0.9px, transparent 3.2px)'
                      }}
                    />

                    <div
                      className="absolute inset-0 rounded-full opacity-45 pointer-events-none mix-blend-screen"
                      style={{
                        background: 'conic-gradient(from 18deg, transparent 0deg, rgba(255,255,255,0.22) 18deg, transparent 42deg, transparent 150deg, rgba(255,255,255,0.16) 178deg, transparent 215deg, transparent 360deg)'
                      }}
                    />

                    <div
                      className="absolute inset-[18px] rounded-full border border-white/5 pointer-events-none"
                      style={{
                        boxShadow: 'inset 0 0 18px rgba(255,255,255,0.03), inset 0 0 40px rgba(0,0,0,0.8)'
                      }}
                    />

                    <div
                      className="absolute inset-[46px] rounded-full border border-white/5 pointer-events-none"
                      style={{
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
                      }}
                    />

                    <div
                      className="absolute left-[16%] top-[12%] w-[46%] h-[22%] rounded-full rotate-[-28deg] pointer-events-none opacity-35 blur-[1px]"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)'
                      }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-28 h-28 rounded-full bg-white border-[7px] border-neutral-950 overflow-hidden relative z-10 flex items-center justify-center"
                        style={{
                          boxShadow: '0 8px 24px rgba(0,0,0,0.85), inset 0 2px 5px rgba(255,255,255,0.6)'
                        }}
                      >
                        {mainPhotoUrl ? (
                          <img
                            src={mainPhotoUrl}
                            className="w-full h-full object-cover"
                            style={{ transform: `translate(${mainPhotoPosX}px, ${mainPhotoPosY}px) scale(${mainPhotoScale})` }}
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-neutral-200 to-neutral-50" />
                        )}

                        <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none" />

                        <div
                          className="absolute w-4 h-4 bg-neutral-950 rounded-full border border-white/30 shadow-inner"
                          style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 4px rgba(0,0,0,0.6)' }}
                        />
                      </div>
                    </div>

                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at center, transparent 0 16%, rgba(0,0,0,0.15) 17% 24%, transparent 25% 100%)'
                      }}
                    />
                  </motion.div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, y: 200 }}
              animate={isOpened ? { scale: 1, y: 135 } : {}}
              transition={{ type: 'spring', damping: 20, delay: 0.4 }}
              onClick={() => isOpened && setView('content')}
              className={`z-30 w-[310px] h-[370px] rounded-[3rem] shadow-xl p-10 flex flex-col items-center justify-between border border-gray-100 cursor-pointer paper-container ${getPaperClass()}`}
              style={
                {
                  '--dynamic-color': cardPaperColor
                } as React.CSSProperties
              }
            >
              <div className="text-center pt-14 w-full">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 break-words" style={{ fontFamily: fontStyle }}>
                  {title || tBuilder.title_placeholder}
                </h2>
                <div className="w-8 h-1 bg-amber-400 mx-auto mb-4" />
                <p className="opacity-60 text-[9px] font-bold uppercase tracking-[0.3em]">{t.tap_open}</p>
              </div>

              <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">
                {lang === 'vi' ? 'Xem chi tiết' : lang === 'en' ? 'See details' : 'Voir les détails'}
              </div>
            </motion.div>

            <div
              className="absolute inset-0 z-50 overflow-hidden"
              style={{
                perspective: '2500px',
                transformStyle: 'preserve-3d',
                pointerEvents: isOpened ? 'none' : 'auto'
              }}
            >
              <AnimatePresence>
                {!isOpened && (
                  <motion.div
                    key="gate-container"
                    exit={{ opacity: 1 }}
                    className="w-full h-full relative flex items-center justify-center"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <AnimatePresence>
                      {!isCodeFading && (
                        <motion.div
                          key="visual-trigger"
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
                          className="absolute inset-0 z-[70] flex flex-col items-center justify-center cursor-pointer"
                          onClick={handleTriggerClick}
                        >
                          <div className="relative w-full flex items-center justify-center">
                            {openingStyle === 'knock' ? (
                              <motion.div
                                animate={{ x: [0, -12, 4, -12, 4, 0], y: [0, -6, 2, -6, 2, 0], scale: [1, 1.05, 0.98, 1.05, 0.98, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                                className="w-56 h-56 select-none flex items-center justify-center"
                              >
                                <img
                                  src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/main-qui-toque.PNG"
                                  className="w-full h-full object-contain drop-shadow-2xl"
                                  alt="Main qui toque"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </motion.div>
                            ) : openingStyle === 'key' ? (
                              <div className="select-none flex items-center justify-center relative w-[260px] h-[260px]">
                                <img
                                  src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/cleserrure.png"
                                  className="absolute w-full h-full object-contain"
                                  alt="Serrure"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />

                                <motion.img
                                  src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/cleserrure.png"
                                  animate={{ rotate: [0, 45, 0, 45, 0] }}
                                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
                                  className="absolute w-full h-full object-contain origin-center"
                                  alt="Clé"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : openingStyle === 'vault' ? (
                              <div className="relative w-[220px] h-[330px] flex flex-col items-center justify-start bg-neutral-950 border-[4px] border-neutral-800 rounded-[1.75rem] shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden p-4">
                                <img
                                  src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/dgital.png"
                                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none"
                                  alt=""
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />

                                <div className="w-full h-16 bg-black/95 rounded-xl border border-neutral-800 p-2 flex flex-col items-center justify-center shadow-inner relative z-10 mb-5">
                                  <span className="text-[7.5px] font-mono tracking-[0.25em] text-neutral-400 font-bold uppercase mb-0.5">
                                    🔒 Invit Studio
                                  </span>

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

                                <div className="grid grid-cols-3 gap-2 w-full max-w-[155px] relative z-10">
                                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => {
                                    const isGlowing = activeKey === key;

                                    return (
                                      <motion.div
                                        key={key}
                                        animate={
                                          isGlowing
                                            ? {
                                                backgroundColor: 'rgba(14, 165, 233, 0.35)',
                                                borderColor: '#38bdf8',
                                                boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
                                                scale: 0.95
                                              }
                                            : {
                                                backgroundColor: 'rgba(23, 23, 23, 0.85)',
                                                borderColor: 'rgba(63, 63, 70, 0.2)',
                                                boxShadow: 'none',
                                                scale: 1
                                              }
                                        }
                                        className="aspect-square flex items-center justify-center rounded-lg border font-mono font-bold text-sm text-neutral-400 transition-all select-none"
                                      >
                                        <span className={isGlowing ? 'text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.9)]' : ''}>
                                          {key}
                                        </span>
                                      </motion.div>
                                    );
                                  })}
                                </div>

                                <div className="w-full mt-3.5 font-mono text-[8px] tracking-widest text-neutral-500 animate-pulse uppercase text-center">
                                  {isVaultClicked ? 'CRACKING CODE...' : 'Tap Device to Unlock'}
                                </div>
                              </div>
                            ) : (
                              <img
                                src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png"
                                className="w-[32rem] h-[32rem] object-contain"
                                alt="Sceau"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>

                          <p className="absolute bottom-12 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse text-center w-full px-4">
                            {lang === 'fr' ? "Appuyez pour ouvrir l'invitation" : lang === 'en' ? 'Tap to open invitation' : 'Nhấn de mở lời mời'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="absolute inset-0 w-full h-full flex" style={{ transformStyle: 'preserve-3d' }}>
                      {containerOpen === 'metal_door' ? (
                        <motion.div
                          exit={{ x: '100%' }}
                          transition={{ duration: 1.6, ease: 'easeInOut' }}
                          className="absolute inset-0 w-full h-full bg-cover bg-center shadow-2xl"
                          style={{
                            backgroundImage: 'url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20noir.png")'
                          }}
                        />
                      ) : containerOpen === 'wooden_door' ? (
                        <>
                          <motion.div
                            initial={{ rotateY: 0 }}
                            exit={{ rotateY: -95, opacity: 0 }}
                            transition={{ duration: 1.4, ease: 'easeInOut' }}
                            className="w-1/2 h-full origin-left bg-cover bg-center shadow-[15px_0_30px_rgba(0,0,0,0.5)] border-r border-black/10"
                            style={{
                              backgroundImage: 'url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20gauche.png")'
                            }}
                          />

                          <motion.div
                            initial={{ rotateY: 0 }}
                            exit={{ rotateY: 95, opacity: 0 }}
                            transition={{ duration: 1.4, ease: 'easeInOut' }}
                            className="w-1/2 h-full origin-right bg-cover bg-center shadow-[-15px_0_30px_rgba(0,0,0,0.5)] border-l border-black/10"
                            style={{
                              backgroundImage: 'url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/porte%20droite.png")'
                            }}
                          />
                        </>
                      ) : (
                        <motion.div
                          key="free-gate-panel"
                          initial={{ y: '0%' }}
                          exit={{ y: '-100%' }}
                          transition={{ duration: 1.3, ease: [0.43, 0.13, 0.23, 0.96] }}
                          className="absolute inset-0 w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-b border-black/10"
                          style={{ background: envelopeColor }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full h-full z-[100] flex flex-col overflow-y-auto paper-container ${getPaperClass()}`}
            style={{ '--dynamic-color': cardPaperColor } as React.CSSProperties}
          >
            <div className="h-[30%] relative overflow-hidden shrink-0">
              <img
                src={mainPhotoUrl}
                className="w-full h-full object-cover"
                style={{ transform: `translate(${mainPhotoPosX}px, ${mainPhotoPosY}px) scale(${mainPhotoScale})` }}
                alt=""
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black mb-4 leading-tight" style={{ fontFamily: fontStyle }}>
                  {hostNames || tBuilder.hosts_placeholder}
                </h2>

                <div className="flex flex-col items-center gap-2 opacity-60 font-bold text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-amber-500" />
                    {eventDate
                      ? new Date(eventDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : t.save_date}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-amber-500" />
                    {eventAddress || tBuilder.address_placeholder}
                  </div>
                </div>
              </div>

              {description && (
                <div className="mb-14 text-center">
                  <p className="text-[13px] leading-relaxed opacity-80 whitespace-pre-wrap italic" style={{ fontFamily: fontStyle }}>
                    {description}
                  </p>
                  <div className="w-12 h-[1px] bg-amber-200 mx-auto mt-6" />
                </div>
              )}

              <div className="space-y-12 pb-10">
                <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] text-center mb-8 flex items-center justify-center gap-2">
                  <Sparkles size={12} />
                  {tBuilder.program_title}
                  <Sparkles size={12} />
                </h3>

                <div className="relative flex flex-col items-center">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 3.0, ease: 'easeInOut' }}
                    className="absolute top-0 w-[2px] h-full bg-gradient-to-b from-amber-200 via-amber-500 to-amber-200 rounded-full origin-top"
                  />

                  <div className="relative space-y-12 w-full pt-4">
                    {(eventProgram || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: '-50px' }}
                          transition={{ duration: 1.2, delay: 0.1 }}
                          className={`flex items-center w-full relative ${isEven ? 'justify-start pl-6' : 'justify-end pr-6'}`}
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: 45 }}
                            whileInView={{ scale: 1, rotate: 45 }}
                            viewport={{ once: true }}
                            className={`absolute top-1/2 -translate-y-1/2 z-20 w-3 h-3 bg-amber-500 border border-white shadow-md ${
                              isEven ? 'right-[50%] translate-x-1/2' : 'left-[50%] -translate-x-1/2'
                            }`}
                          >
                            <motion.div
                              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                              transition={{ duration: 2.5, repeat: Infinity }}
                              className="absolute inset-0 bg-amber-300 rounded-sm"
                            />
                          </motion.div>

                          <div className={`w-[45%] overflow-hidden bg-white/60 rounded-2xl border border-amber-50 backdrop-blur-sm shadow-lg ${isEven ? 'text-left' : 'text-right'}`}>
                            {step.image_url && (
                              <div className="w-full aspect-video overflow-hidden">
                                <img src={step.image_url} className="w-full h-full object-cover" alt="" />
                              </div>
                            )}

                            <div className="p-4">
                              <div className={`text-[9px] font-black text-amber-600 mb-1 flex items-center gap-1 ${isEven ? 'justify-start' : 'justify-end'}`}>
                                <Clock size={8} />
                                {step.time}
                              </div>

                              <div className="text-[11px] font-bold uppercase tracking-tight leading-tight" style={{ fontFamily: fontStyle }}>
                                {step.activity}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {planType === 'PREMIUM' && endPhotoUrl && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20 px-2 pb-10">
                  <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white rotate-2">
                    <img
                      src={endPhotoUrl}
                      className="w-full h-auto"
                      style={{
                        transform: `translate(${pick(invitation, ['end_photo_url_pos_x', 'endphotourlposx'], 0)}px, ${pick(invitation, ['end_photo_url_pos_y', 'endphotourlposy'], 0)}px) scale(${pick(invitation, ['end_photo_url_scale', 'endphotourlscale'], 1)})`
                      }}
                      alt="Final"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
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
