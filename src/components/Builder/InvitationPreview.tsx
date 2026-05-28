import { useState, useMemo, useEffect, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Volume2, VolumeX, MapPin, Clock, Sparkles, Film, CheckCircle2 } from 'lucide-react';
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

type OpeningCategory = 'birthday' | 'wedding' | 'party' | 'other';

type OpeningTheme = {
  id: string;
  category: OpeningCategory;
  label: string;
  videoUrl: string;
};

const UNIVERSAL_OPENING_POSTER_URL =
  'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Gemini_Generated_Image_xoo4grxoo4grxoo4%20(1).png';

const OPENING_THEMES: OpeningTheme[] = [
  {
    id: 'wedding_just_married',
    category: 'wedding',
    label: 'Mariage Just Married',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/just%20Married.mp4'
  },
  {
    id: 'wedding_fusion',
    category: 'wedding',
    label: 'Mariage Fusion',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Alliance%20Fusion.mp4'
  },
  {
    id: 'wedding_ceremony',
    category: 'wedding',
    label: 'Mariage Cérémonie',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Allance%20couple.mp4'
  },
  {
    id: 'wedding_presentation',
    category: 'wedding',
    label: 'Mariage Présentation',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/aliance%20Presentaation.mp4'
  },
  {
    id: 'birthday_balloons',
    category: 'birthday',
    label: 'Anniversaire Ballons',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Aniv%20Ballons.mp4'
  },
  {
    id: 'birthday_glitter',
    category: 'birthday',
    label: 'Anniversaire Paillettes',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Aniv%20Paillettes.mp4'
  },
  {
    id: 'birthday_pink',
    category: 'birthday',
    label: 'Anniversaire Pink',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Anniv%20Pink.mp4'
  },
  {
    id: 'birthday_baby',
    category: 'birthday',
    label: 'Anniversaire Bébé',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Anniv%20baby.mp4'
  },
  {
    id: 'party_disco',
    category: 'party',
    label: 'Fête Disco',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Disco.mp4'
  },
  {
    id: 'party_dance',
    category: 'party',
    label: 'Fête Danse',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Grou.mp4'
  },
  {
    id: 'party_monkey',
    category: 'party',
    label: 'Fête Monkey',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Monkey.mp4'
  },
  {
    id: 'party_together',
    category: 'party',
    label: 'Fête Together',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Together.mp4'
  },
  {
    id: 'other_love_flowers',
    category: 'other',
    label: 'Love Fleurs',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Lov%20Flower.mp4'
  },
  {
    id: 'other_spiritual',
    category: 'other',
    label: 'Spirituel',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Sprituel.mp4'
  },
  {
    id: 'other_new_year',
    category: 'other',
    label: 'Nouvel An',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Nouvel%20an.mp4'
  },
  {
    id: 'other_memorial',
    category: 'other',
    label: 'Hommage',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Bougie.mp4'
  }
];

const DEFAULT_THEME_BY_EVENT: Record<string, string> = {
  wedding: 'wedding_just_married',
  birthday: 'birthday_pink',
  party: 'party_disco',
  baptism: 'other_spiritual',
  babyshower: 'birthday_baby',
  funeral: 'other_memorial',
  default: 'other_love_flowers'
};

const OPENING_FADE_DURATION = 0.85;
const OPENING_REVEAL_DELAY = 420;

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
  const [isOpeningFading, setIsOpeningFading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const openingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const lang = (pick(invitation, ['language']) as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].guest;
  const tBuilder = translations[lang].builder;

  const eventType = pick(invitation, ['event_type', 'eventtype'], 'wedding');
  const emojis = THEME_EMOJIS[eventType] || THEME_EMOJIS.default;

  const planType = pick(invitation, ['plan_type', 'plantype'], 'FREE');
  const isPremium = planType === 'PREMIUM';

  const paperType = pick(invitation, ['paper_type', 'papertype'], 'smooth');
  const openingType = pick(invitation, ['opening_type', 'openingtype'], 'vinyl');

  const backgroundTheme = pick(invitation, ['background_theme', 'backgroundtheme'], '');
  const premiumTriggerType = pick(invitation, ['premium_trigger_type', 'premiumtriggertype'], 'emoji');

  const fontStyle = pick(invitation, ['font_style', 'fontstyle'], 'inherit');
  const paperColor = pick(invitation, ['paper_color', 'papercolor'], '#ffffff');
  const envelopeColor = pick(invitation, ['envelope_color', 'envelopecolor'], '#FEE2E2');
  const backgroundColor = pick(invitation, ['background_color', 'backgroundcolor'], '#ffffff');

  const title = pick(invitation, ['title'], '');
  const hostNames = pick(invitation, ['host_names', 'hostnames'], '');
  const description = pick(invitation, ['description'], '');
  const mainPhotoUrl = pick(invitation, ['main_photo_url', 'mainphotourl'], '');
  const musicUrl = pick(invitation, ['music_url', 'musicurl'], '');
  const eventDate = pick(invitation, ['event_date', 'eventdate'], '');
  const eventAddress = pick(invitation, ['event_address', 'eventaddress'], '');
  const endPhotoUrl = pick(invitation, ['end_photo_url', 'endphotourl'], '');
  const eventProgram = pick(invitation, ['event_program', 'eventprogram'], []);
  const photoUrl2 = pick(invitation, ['photo_url_2', 'photourl2'], '');
  const photoUrl3 = pick(invitation, ['photo_url_3', 'photourl3'], '');

  const premiumMidTitle = pick(invitation, ['premium_mid_title'], '');
  const premiumMidText = pick(invitation, ['premium_mid_text'], '');
  const premiumMidPhotoUrl = pick(invitation, ['premium_mid_photo_url'], '');

  const premiumFinalTitle = pick(invitation, ['premium_final_title'], '');
  const premiumFinalText = pick(invitation, ['premium_final_text'], '');
  const premiumFinalPhotoUrl = pick(invitation, ['premium_final_photo_url'], '');

  const selectedOpeningThemeId = pick(
    invitation,
    ['opening_theme', 'openingtheme'],
    DEFAULT_THEME_BY_EVENT[eventType] || DEFAULT_THEME_BY_EVENT.default
  );

  const selectedOpeningTheme =
    OPENING_THEMES.find((theme) => theme.id === selectedOpeningThemeId) ||
    OPENING_THEMES.find((theme) => theme.id === DEFAULT_THEME_BY_EVENT[eventType]) ||
    OPENING_THEMES.find((theme) => theme.id === DEFAULT_THEME_BY_EVENT.default) ||
    OPENING_THEMES[0];

  const openingVideoUrl = pick(invitation, ['opening_video_url', 'openingvideourl'], selectedOpeningTheme.videoUrl);
  const openingPosterUrl = pick(invitation, ['opening_poster_url', 'openingposterurl'], UNIVERSAL_OPENING_POSTER_URL);

  const isPremiumDecor = isPremium && premiumTriggerType === 'decor';

  const effectivePaperType = paperType || 'smooth';
  const cardPaperColor = paperColor || '#ffffff';
  const previewBackgroundColor = isPremiumDecor && backgroundColor ? backgroundColor : '#ffffff';

  const mainPhotoPosX = pick(invitation, ['main_photo_url_pos_x', 'mainphotourlposx'], 0);
  const mainPhotoPosY = pick(invitation, ['main_photo_url_pos_y', 'mainphotourlposy'], 0);
  const mainPhotoScale = pick(invitation, ['main_photo_url_scale', 'mainphotourlscale'], 1);

  const isFreeShutterOpening = !isPremium;
  const openingVideoVisible = isVideoReady && !isOpeningFading;

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

  const premiumGalleryPhotos = useMemo(() => {
    if (!isPremium) return [];

    const photos = [
      { url: mainPhotoUrl, label: title || 'Photo' },
      { url: photoUrl2, label: 'Photo 2' },
      { url: photoUrl3, label: 'Photo 3' },
      { url: premiumMidPhotoUrl, label: premiumMidTitle || 'Moment' },
      { url: premiumFinalPhotoUrl, label: premiumFinalTitle || 'Souvenir' },
      { url: endPhotoUrl, label: tBuilder.end_photo || 'Final' }
    ];

    const seen = new Set<string>();

    return photos.filter((photo) => {
      if (!photo.url || seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    });
  }, [
    isPremium,
    mainPhotoUrl,
    photoUrl2,
    photoUrl3,
    premiumMidPhotoUrl,
    premiumFinalPhotoUrl,
    endPhotoUrl,
    premiumMidTitle,
    premiumFinalTitle,
    title,
    tBuilder.end_photo
  ]);

  useEffect(() => {
    return () => {
      openingTimersRef.current.forEach(clearTimeout);
      openingTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    setIsVideoReady(false);
  }, [openingVideoUrl]);

  useEffect(() => {
    if (isOpened && musicUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, musicUrl]);

  const triggerContainerOpening = () => {
    setIsOpened(true);
    audioRef.current?.play().catch(() => {});
  };

  const handleTriggerClick = () => {
    if (isOpeningFading) return;

    const revealDelay = isFreeShutterOpening ? 720 : OPENING_REVEAL_DELAY;

    openingTimersRef.current.forEach(clearTimeout);
    openingTimersRef.current = [];

    setIsOpeningFading(true);

    const revealTimer = setTimeout(() => {
      triggerContainerOpening();
    }, revealDelay);

    openingTimersRef.current.push(revealTimer);
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
        Array.from({ length: 26 }).map((_, i) => ({
          id: i,
          emoji: emojis[i % emojis.length],
          left: `${2 + i * 3.8 + Math.random() * 2.4}%`,
          delay: Math.random() * 1.2,
          duration: 2.5 + Math.random() * 1.2,
          size: 22 + Math.random() * 10,
          drift: -22 + Math.random() * 44,
          rotate: -18 + Math.random() * 36
        })),
      [emojis]
    );

    return (
      <div className="absolute inset-0 z-[14] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ y: -80, x: 0, opacity: 0, rotate: p.rotate, scale: 0.8 }}
            animate={{
              y: 760,
              x: p.drift,
              opacity: [0, 1, 1, 0],
              rotate: p.rotate + 38,
              scale: [0.8, 1, 1, 0.9]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear'
            }}
            className="absolute leading-none select-none"
            style={{ left: p.left, fontSize: p.size }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  const OpeningVideoLayer = () => {
    return (
      <motion.div
        initial={false}
        animate={{ opacity: isOpeningFading ? 0 : 1 }}
        transition={{ duration: OPENING_FADE_DURATION, ease: 'easeInOut' }}
        className="absolute inset-0 z-40 overflow-hidden bg-[#f8f4ec] pointer-events-none"
      >
        <motion.img
          src={openingPosterUrl}
          initial={false}
          animate={{ opacity: openingVideoVisible ? 0 : 1 }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
          draggable={false}
        />

        <motion.video
          key={openingVideoUrl}
          src={openingVideoUrl}
          poster={openingPosterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setIsVideoReady(true)}
          onCanPlay={() => setIsVideoReady(true)}
          onCanPlayThrough={() => setIsVideoReady(true)}
          initial={false}
          animate={{ opacity: openingVideoVisible ? 1 : 0 }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/10" />
      </motion.div>
    );
  };

  const FreeShutterLayer = () => {
    return (
      <>
        <motion.div
          animate={isOpeningFading ? { y: '-100%', opacity: 0.92 } : { y: '0%', opacity: 1 }}
          transition={{ duration: 0.82, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="absolute inset-0 z-50 w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.42)] border-b border-black/10"
          style={{
            background:
              typeof envelopeColor === 'string' && envelopeColor.includes('gradient')
                ? envelopeColor
                : `linear-gradient(145deg, ${envelopeColor}, #ffffff 48%, ${envelopeColor})`
          }}
        />

        <motion.div
          animate={isOpeningFading ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="absolute inset-0 z-50 w-full h-full"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.24), transparent 30%), linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.22))'
          }}
        />
      </>
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
        Array.from({ length: 48 }).map((_, i) => ({
          id: i,
          left: `${2 + Math.random() * 96}%`,
          delay: Math.random() * 3.5,
          duration: 2.4 + Math.random() * 1.8,
          sizeClass: i % 3 === 0 ? 'w-3 h-auto' : 'w-2 h-auto',
          rotate: Math.random() * 180
        })),
      []
    );

    return (
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
        {theme === 'flowers' && (
          <>
            <div
              className="absolute -top-8 -right-8 w-56 h-56 bg-contain bg-no-repeat bg-right-top z-20"
              style={{ backgroundImage: 'url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/fleurs%20haut%20droite.png")' }}
            />
            <div
              className="absolute -bottom-8 -left-8 w-56 h-56 bg-contain bg-no-repeat bg-left-bottom z-20"
              style={{ backgroundImage: 'url("https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/fleurs%20bas%20gauche.png")' }}
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

        {theme === 'stars' && (
          <>
            {etoilesPluie.map((e) => (
              <motion.img
                key={`etoile-dense-${e.id}`}
                src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/etoile.png"
                initial={{ y: -40, opacity: 0, scale: 0.55, rotate: e.rotate }}
                animate={{
                  y: 720,
                  opacity: [0, 1, 1, 0.9, 0],
                  scale: [0.55, 1, 0.95, 0.7],
                  rotate: e.rotate + 120
                }}
                transition={{
                  duration: e.duration,
                  times: [0, 0.18, 0.72, 0.9, 1],
                  repeat: Infinity,
                  delay: e.delay,
                  ease: 'easeIn'
                }}
                className={`absolute ${e.sizeClass} drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]`}
                style={{ left: e.left }}
                alt=""
              />
            ))}
            <div className="star-pile" />
          </>
        )}
      </div>
    );
  };

  const ContentOrnaments = () => {
    const threads = useMemo(
      () =>
        Array.from({ length: 8 }).map((_, i) => ({
          id: i,
          left: `${8 + Math.random() * 84}%`,
          top: `${8 + Math.random() * 86}%`,
          rotate: `${-28 + Math.random() * 56}deg`,
          delay: Math.random() * 2.4,
          duration: 4 + Math.random() * 2
        })),
      []
    );

    const sparks = useMemo(
      () =>
        Array.from({ length: 14 }).map((_, i) => ({
          id: i,
          left: `${6 + Math.random() * 88}%`,
          top: `${6 + Math.random() * 88}%`,
          delay: Math.random() * 2.8,
          duration: 2.8 + Math.random() * 2.2,
          scale: 0.65 + Math.random() * 0.75
        })),
      []
    );

    return (
      <div className="invitation-ornament-layer">
        {threads.map((thread) => (
          <motion.span
            key={`thread-${thread.id}`}
            className="gold-thread"
            style={{ left: thread.left, top: thread.top, rotate: thread.rotate }}
            animate={{ opacity: [0.08, 0.38, 0.08], x: [0, 8, 0] }}
            transition={{ duration: thread.duration, repeat: Infinity, delay: thread.delay, ease: 'easeInOut' }}
          />
        ))}

        {sparks.map((spark) => (
          <motion.span
            key={`spark-${spark.id}`}
            className="gold-spark"
            style={{ left: spark.left, top: spark.top, scale: spark.scale }}
            animate={{ opacity: [0, 0.85, 0], rotate: [0, 45, 90], y: [0, -8, 0] }}
            transition={{ duration: spark.duration, repeat: Infinity, delay: spark.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    );
  };

  const PremiumStorySection = ({ title, text, imageUrl, reverse }: any) => {
    if (!isPremium || (!title && !text && !imageUrl)) return null;

    return (
      <motion.section
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative"
      >
        <div className={`flex flex-col gap-5 ${reverse ? 'items-end text-right' : 'items-start text-left'}`}>
          {imageUrl && (
            <motion.div
              initial={{ opacity: 0, rotate: reverse ? 3 : -3, scale: 0.94 }}
              whileInView={{ opacity: 1, rotate: reverse ? 1.5 : -1.5, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="w-full overflow-hidden rounded-[2.25rem] border-4 border-white shadow-2xl bg-white"
            >
              <img src={imageUrl} loading="lazy" className="w-full aspect-[4/3] object-cover" alt="" />
            </motion.div>
          )}

          <div className="relative bg-white/55 backdrop-blur-sm border border-amber-100 rounded-[2rem] p-6 shadow-lg">
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-300/20 blur-md" />

            {title && (
              <h3 className="text-xl font-black mb-3 leading-tight" style={{ fontFamily: fontStyle }}>
                {title}
              </h3>
            )}

            {text && (
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap opacity-75 italic" style={{ fontFamily: fontStyle }}>
                {text}
              </p>
            )}
          </div>
        </div>
      </motion.section>
    );
  };

  const showEmojiRain = isOpened && (planType !== 'PREMIUM' || premiumTriggerType === 'emoji' || !premiumTriggerType);
  const showPremiumDecor = isOpened && isPremiumDecor;

  return (
    <div
      className="relative w-full h-full max-h-[650px] flex items-center justify-center overflow-hidden rounded-[3.5rem] shadow-2xl border-[12px] border-gray-50/50"
      style={{ fontFamily: fontStyle, background: previewBackgroundColor } as CSSProperties}
    >
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop />}

      {showEmojiRain && <EmojiRain />}
      {showPremiumDecor && <AutonomousDecor />}

      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
            {!isFreeShutterOpening && !isOpened && <OpeningVideoLayer />}

            {isOpened && musicUrl && (
              <button onClick={toggleMute} className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
              </button>
            )}

            <motion.div
              initial={{ y: 0, opacity: 0 }}
              animate={isOpened ? { y: openingType === 'filmstrip' ? -160 : -140, opacity: 1 } : { y: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, delay: 0.08 }}
              className="absolute z-20"
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
                <motion.div
                  animate={isOpened ? { rotate: 360 } : { rotate: 0 }}
                  transition={isOpened ? { repeat: Infinity, duration: 4, ease: 'linear', delay: 0.8 } : { duration: 0.5 }}
                  className="w-[250px] h-[250px] relative rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.7),_inset_0_0_30px_rgba(255,255,255,0.08)] border-4 border-neutral-800 flex items-center justify-center overflow-hidden"
                  style={{ background: 'radial-gradient(circle at 30% 30%, #2a2a2a, #0a0a0a)' }}
                >
                  <div className="absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none" style={{ background: 'repeating-radial-gradient(circle, #404040 0px, #1a1a1a 1px, #0d0d0d 2px)' }} />
                  <motion.div
                    animate={isOpened ? { rotate: -360 } : { rotate: 0 }}
                    transition={isOpened ? { repeat: Infinity, duration: 4, ease: 'linear', delay: 0.8 } : { duration: 0.5 }}
                    className="absolute inset-0 opacity-25 pointer-events-none mix-blend-screen"
                    style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.5) 45deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.5) 225deg, transparent 270deg)' }}
                  />

                  <div className="w-24 h-24 bg-white rounded-full border-[6px] border-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.3)] overflow-hidden relative z-10 flex items-center justify-center">
                    {mainPhotoUrl && (
                      <img
                        src={mainPhotoUrl}
                        className="w-full h-full object-cover"
                        style={{ transform: `translate(${mainPhotoPosX}px, ${mainPhotoPosY}px) scale(${mainPhotoScale})` }}
                        alt=""
                      />
                    )}
                    <div className="absolute w-3 h-3 bg-neutral-950 rounded-full shadow-inner border border-white/30" />
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, y: 0, opacity: 0 }}
              animate={isOpened ? { scale: 1, y: 80, opacity: 1 } : { y: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, delay: 0.05 }}
              onClick={() => isOpened && setView('content')}
              className={`z-30 w-[310px] h-[370px] rounded-[3rem] shadow-2xl p-10 flex flex-col items-center justify-between border border-gray-100 cursor-pointer paper-container ${getPaperClass()}`}
              style={{ '--dynamic-color': cardPaperColor } as CSSProperties}
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

            {!isOpened && (
              <div className="absolute inset-0 z-50 overflow-hidden" style={{ perspective: '2200px', transformStyle: 'preserve-3d', pointerEvents: 'auto' }}>
                <motion.div key="gate-container" className="w-full h-full relative flex items-center justify-center">
                  {!isFreeShutterOpening && (
                    <motion.div
                      initial={false}
                      animate={isOpeningFading || openingVideoVisible ? { opacity: 0 } : { opacity: 1 }}
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                      className="absolute bottom-12 z-[80] text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse text-center w-full px-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] pointer-events-none"
                    >
                      {lang === 'fr' ? "Appuyez pour ouvrir l'invitation" : lang === 'en' ? 'Tap to open invitation' : 'Nhấn để mở lời mời'}
                    </motion.div>
                  )}

                  <motion.div
                    key="visual-trigger"
                    initial={{ opacity: 1 }}
                    animate={isOpeningFading ? { opacity: 0 } : { opacity: 1 }}
                    transition={{ duration: OPENING_FADE_DURATION, ease: 'easeInOut' }}
                    className="absolute inset-0 z-[70] flex flex-col items-center justify-center cursor-pointer"
                    style={{ pointerEvents: isOpeningFading ? 'none' : 'auto' }}
                    onClick={handleTriggerClick}
                  >
                    {isFreeShutterOpening && (
                      <p className="absolute bottom-12 z-[80] text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse text-center w-full px-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                        {lang === 'fr' ? "Appuyez pour ouvrir l'invitation" : lang === 'en' ? 'Tap to open invitation' : 'Nhấn để mở lời mời'}
                      </p>
                    )}
                  </motion.div>

                  <div className="absolute inset-0 z-50 w-full h-full flex" style={{ perspective: '2200px', transformStyle: 'preserve-3d' }}>
                    {isFreeShutterOpening && <FreeShutterLayer />}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full h-full z-[100] flex flex-col overflow-y-auto paper-container ${getPaperClass()}`}
            style={{ '--dynamic-color': cardPaperColor } as CSSProperties}
          >
            <ContentOrnaments />

            <motion.div initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} className="h-[32%] relative overflow-hidden shrink-0">
              {mainPhotoUrl && (
                <motion.img
                  src={mainPhotoUrl}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.08 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  style={{ transform: `translate(${mainPhotoPosX}px, ${mainPhotoPosY}px) scale(${mainPhotoScale})` }}
                  alt=""
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent pointer-events-none" />

              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                <X size={20} />
              </button>
            </motion.div>

            <div className="relative flex-1 p-8 space-y-14">
              <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.15 }} className="text-center">
                <motion.h2 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }} className="text-3xl font-black mb-4 leading-tight" style={{ fontFamily: fontStyle }}>
                  {hostNames || tBuilder.hosts_placeholder}
                </motion.h2>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.45 }} className="flex flex-col items-center gap-2 opacity-70 font-bold text-[10px] uppercase tracking-widest text-gray-700">
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
                </motion.div>
              </motion.div>

              {description && (
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.85 }} className="text-center italic opacity-85" style={{ fontFamily: fontStyle }}>
                  <p className="text-[13px] leading-relaxed px-4 whitespace-pre-wrap">{description}</p>
                  <div className="w-12 h-[1px] bg-amber-200 mx-auto mt-6" />
                </motion.div>
              )}

              <div className="space-y-12">
                <motion.h3 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.75 }} className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-2">
                  <Sparkles size={12} /> {tBuilder.program_title} <Sparkles size={12} />
                </motion.h3>

                <div className="relative flex flex-col items-center">
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    whileInView={{ scaleY: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 3.0, ease: 'easeInOut' }}
                    className="absolute top-0 w-[2px] h-full bg-gradient-to-b from-amber-100 via-amber-500 to-amber-100 origin-top shadow-[0_0_16px_rgba(245,158,11,0.55)]"
                  />

                  <div className="relative space-y-12 w-full">
                    {(eventProgram || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: isEven ? -42 : 42, y: 16 }}
                          whileInView={{ opacity: 1, x: 0, y: 0 }}
                          viewport={{ once: true, margin: '-60px' }}
                          transition={{ duration: 0.9, delay: 0.05, ease: 'easeOut' }}
                          className={`flex items-center w-full relative ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                        >
                          <div className="w-[45%]">
                            <div className={`overflow-hidden bg-white/65 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-lg ${isEven ? 'text-right' : 'text-left'}`}>
                              {step.image_url && (
                                <div className="w-full aspect-video overflow-hidden">
                                  <motion.img
                                    src={step.image_url}
                                    loading="lazy"
                                    initial={{ scale: 1.08 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.1 }}
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                </div>
                              )}

                              <div className="p-4">
                                <div className={`text-[9px] font-black text-amber-600 mb-1 flex items-center gap-1 ${isEven ? 'justify-start' : 'justify-end'}`}>
                                  <Clock size={8} /> {step.time}
                                </div>
                                <div className="text-[11px] font-bold uppercase tracking-tight leading-tight" style={{ fontFamily: fontStyle }}>
                                  {step.activity}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="w-[10%] flex justify-center">
                            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', damping: 12 }} className="relative z-10">
                              <div className="w-3 h-3 bg-amber-500 rounded-full ring-4 ring-white shadow-sm" />
                              <motion.div animate={{ scale: [1, 2.2, 1], opacity: [0.45, 0, 0.45] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15 }} className="absolute inset-0 rounded-full bg-amber-400" />
                            </motion.div>
                          </div>

                          <div className="w-[45%]" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <PremiumStorySection title={premiumMidTitle} text={premiumMidText} imageUrl={premiumMidPhotoUrl} />

              {isPremium && premiumGalleryPhotos.length >= 2 && (
                <motion.section initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9 }} className="space-y-6">
                  <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-2">
                    <Sparkles size={12} />
                    {lang === 'fr' ? 'Album souvenir' : lang === 'en' ? 'Memory album' : 'Album kỷ niệm'}
                    <Sparkles size={12} />
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {premiumGalleryPhotos.slice(0, 6).map((photo, index) => (
                      <motion.div
                        key={`${photo.url}-${index}`}
                        initial={{ opacity: 0, y: 24, rotate: index % 2 === 0 ? -4 : 4 }}
                        whileInView={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -2 : 2 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.75, delay: index * 0.08 }}
                        className={`${index === 0 ? 'col-span-2' : ''} bg-white p-2 rounded-2xl shadow-xl border border-white overflow-hidden`}
                      >
                        <img src={photo.url} loading="lazy" className={`${index === 0 ? 'aspect-[16/10]' : 'aspect-square'} w-full object-cover rounded-xl`} alt="" />
                        <div className="px-2 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">{photo.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {isPremium && endPhotoUrl && (
                <motion.div initial={{ opacity: 0, y: 34, rotate: 0 }} whileInView={{ opacity: 1, y: 0, rotate: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9 }} className="px-2">
                  <div className="text-center mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">
                      {lang === 'fr' ? 'Un souvenir à garder' : lang === 'en' ? 'A memory to keep' : 'Một kỷ niệm để giữ'}
                    </p>
                  </div>

                  <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-white">
                    <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-black/10 via-transparent to-white/20" />
                    <img
                      src={endPhotoUrl}
                      loading="lazy"
                      className="w-full h-auto"
                      style={{
                        transform: `translate(${pick(invitation, ['end_photo_url_pos_x', 'endphotourlposx'], 0)}px, ${pick(invitation, ['end_photo_url_pos_y', 'endphotourlposy'], 0)}px) scale(${pick(invitation, ['end_photo_url_scale', 'endphotourlscale'], 1)})`
                      }}
                      alt=""
                    />
                  </div>
                </motion.div>
              )}

              <PremiumStorySection title={premiumFinalTitle} text={premiumFinalText} imageUrl={premiumFinalPhotoUrl} reverse />

              <motion.div
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9 }}
                className="relative bg-gray-900 rounded-[3rem] p-8 shadow-2xl border border-amber-300/20 overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_42%)]" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />

                <div className="relative z-10 py-6 text-center space-y-4">
                  <CheckCircle2 size={40} className="text-amber-400 mx-auto drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                  <h3 className="font-black uppercase tracking-widest text-xs text-white text-center">{t.confirm_rsvp}</h3>
                  <p className="text-white/45 text-[11px] font-bold uppercase tracking-widest">
                    {lang === 'fr' ? 'Aperçu du formulaire invité' : lang === 'en' ? 'Guest form preview' : 'Xem trước biểu mẫu'}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
