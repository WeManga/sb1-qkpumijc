import { useState, useMemo, useEffect, useRef, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle2, Film, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import {
  UNIVERSAL_OPENING_POSTER_URL,
  OPENING_THEMES,
  DEFAULT_THEME_BY_EVENT
} from '../../constants/openingThemes';

const THEME_EMOJIS: Record<string, string[]> = {
  wedding: ['🤍', '💍', '🕊️', '✨', '🌸'],
  birthday: ['🎂', '🎈', '✨', '🎉', '🍰'],
  party: ['✨', '🎸', '🥂', '🕺', '🌟'],
  baptism: ['👼', '☁️', '🤍', '✨', '🕊️'],
  babyshower: ['🍼', '🤍', '👶', '💖', '💙'],
  funeral: ['🙏', '🕊️', '🥀', '🤍', '✨'],
  default: ['✨', '🌟', '🤍']
};

const OPENING_FADE_DURATION = 0.85;
const OPENING_REVEAL_DELAY = 420;
const CONTENT_TRANSITION_DURATION = 0.95;
const LEAF_FRAME_URL =
  'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/feuille%20carousselle.png';

const isAndroidDevice = () =>
  typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const pick = (obj: any, keys: string[], fallback: any = undefined) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') return obj[key];
  }

  return fallback;
};

const getAlbumTitle = (lang: Language) => {
  if (lang === 'en') return 'Memory album';
  if (lang === 'vi') return 'Album kỷ niệm';
  return 'Album souvenir';
};

const getKeepsakeText = (lang: Language) => {
  if (lang === 'en') return 'A memory to keep';
  if (lang === 'vi') return 'Một kỷ niệm để giữ';
  return 'Un souvenir à garder';
};

const getDetailsLabel = (lang: Language) => {
  if (lang === 'en') return 'See details';
  if (lang === 'vi') return 'Xem chi tiết';
  return 'Voir les détails';
};

const getReplayLabel = (lang: Language) => {
  if (lang === 'en') return 'Replay opening';
  if (lang === 'vi') return 'Xem lại mở thiệp';
  return "Revoir l'ouverture";
};

// Petit helper de reveal au scroll : fondu + léger glissement, une seule fois.
const revealProps = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.35 },
  transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }
});

const EmojiRain = ({ emojis }: { emojis: string[] }) => {
  const particles = useMemo(() => {
    if (prefersReducedMotion()) return [];

    const android = isAndroidDevice();
    const count = android ? 12 : 24;
    const safeEmojis = emojis.length > 0 ? emojis : THEME_EMOJIS.default;

    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      emoji: safeEmojis[i % safeEmojis.length],
      left: `${4 + i * (android ? 7.5 : 4) + Math.random() * 2.4}%`,
      delay: Math.random() * 1.5,
      duration: android ? 3.6 + Math.random() * 1.4 : 2.8 + Math.random() * 1.2,
      size: android ? 18 + Math.random() * 7 : 22 + Math.random() * 10,
      drift: android ? -16 + Math.random() * 32 : -24 + Math.random() * 48,
      rotate: -18 + Math.random() * 36,
      travelY: android ? '108vh' : '118vh'
    }));
  }, [emojis]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -90, x: 0, opacity: 0, rotate: p.rotate, scale: 0.8 }}
          animate={{
            y: p.travelY,
            x: p.drift,
            opacity: [0, 1, 1, 0],
            rotate: p.rotate + 38,
            scale: [0.8, 1, 1, 0.9]
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
          className="absolute leading-none select-none will-change-transform"
          style={{ left: p.left, fontSize: p.size }}
        >
          {p.emoji}
        </motion.span>
      ))}
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

// Barre lumineuse qui balaie l'écran une seule fois à l'ouverture du contenu complet.
// (contrairement à la version "sweep" complète, il n'y a ici aucun halo/lueur autour de l'écran)
const RevealSweepBar = () => (
  <div className="pointer-events-none absolute inset-0 z-[130] overflow-hidden rounded-[3.5rem]">
    <motion.div
      className="absolute top-0 bottom-0"
      style={{
        width: '55%',
        background:
          'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0.9) 48%, rgba(251,191,36,0.7) 57%, rgba(255,255,255,0) 76%, transparent 100%)',
        filter: 'blur(1.5px)',
        mixBlendMode: 'screen'
      }}
      initial={{ left: '120%' }}
      animate={{ left: '-70%' }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
    />
  </div>
);

const AutonomousDecor = ({ theme, isPremiumDecor }: { theme: string; isPremiumDecor: boolean }) => {
  const android = isAndroidDevice();

  const ballons = useMemo(
    () =>
      Array.from({ length: android ? 4 : 6 }).map((_, i) => ({
        id: i,
        left: `${15 + i * 14 + Math.random() * 4}%`,
        delay: i * 0.5,
        duration: 6 + Math.random() * 3
      })),
    [android]
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
      Array.from({ length: android ? 24 : 48 }).map((_, i) => ({
        id: i,
        left: `${2 + Math.random() * 96}%`,
        delay: Math.random() * 3.5,
        duration: 2.4 + Math.random() * 1.8,
        sizeClass: i % 3 === 0 ? 'w-3 h-auto' : 'w-2 h-auto',
        rotate: Math.random() * 180
      })),
    [android]
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
            className="absolute w-10 h-auto will-change-transform"
            style={{ left: b.left }}
            alt=""
          />
        ))}

      {theme === 'butterflies' &&
        isPremiumDecor &&
        papillonsConfig.slice(0, android ? 3 : papillonsConfig.length).map((p) => (
          <motion.div
            key={`pap-infinite-${p.id}`}
            initial={{ x: p.initX, y: p.initY, opacity: 0 }}
            animate={{ x: p.pathX, y: p.pathY, opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
            className="absolute will-change-transform"
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
                y: '106vh',
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
              className={`absolute ${e.sizeClass} drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] will-change-transform`}
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


const getPhotoFrameStyle = (invitation: any, sourceKey?: string): CSSProperties => {
  if (!sourceKey) return {};

  const x = pick(invitation, [`${sourceKey}_pos_x`, `${sourceKey}posx`], 0);
  const y = pick(invitation, [`${sourceKey}_pos_y`, `${sourceKey}posy`], 0);
  const scale = pick(invitation, [`${sourceKey}_scale`, `${sourceKey}scale`], 1);

  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: 'center center'
  };
};

const CroppedPhoto = ({ src, sourceKey, invitation, className }: any) => (
  <img
    src={src}
    loading="lazy"
    className={className}
    style={getPhotoFrameStyle(invitation, sourceKey)}
    alt=""
  />
);
const PremiumStorySection = ({ isPremium, title, text, imageUrl, imageKey, invitation, fontStyle }: any) => {
  if (!isPremium || (!title && !text && !imageUrl)) return null;

  return (
    <motion.section {...revealProps()} className="relative">
      <div className="flex flex-col items-center text-center gap-5">
        {imageUrl && (
          <div className="w-full overflow-hidden rounded-[2.25rem] border-4 border-white shadow-2xl bg-white">
            <CroppedPhoto src={imageUrl} sourceKey={imageKey} invitation={invitation} className="w-full aspect-[4/3] object-cover" />
          </div>
        )}

        <div className="relative w-full bg-white/55 backdrop-blur-sm border border-amber-100 rounded-[2rem] p-6 shadow-lg">
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-300/20 blur-md"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {title && (
            <h3 className="text-2xl font-semibold mb-3 leading-tight text-center" style={{ fontFamily: fontStyle }}>
              {title}
            </h3>
          )}

          {text && (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap opacity-80 italic text-center" style={{ fontFamily: fontStyle }}>
              {text}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

const PremiumSingleAlbumPhoto = ({ photo, lang, invitation }: any) => {
  if (!photo?.url) return null;

  return (
    <motion.section
      {...revealProps()}
      className="relative overflow-hidden rounded-[2.75rem] border border-emerald-100 bg-white/80 px-5 py-8 shadow-[0_24px_70px_rgba(16,185,129,0.13)]"
    >
      <div
        className="absolute inset-0 opacity-35 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url("${LEAF_FRAME_URL}")` }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/75 via-white/25 to-white/75" />
      <div className="absolute left-8 top-8 w-20 h-20 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />
      <div className="absolute right-6 bottom-6 w-24 h-24 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-7">
        <h3 className="text-[13px] font-semibold text-emerald-700 text-center">
          {getAlbumTitle(lang)}
        </h3>

        <div className="relative mx-auto w-full max-w-[310px] overflow-hidden rounded-[2.4rem] border-[7px] border-white bg-white shadow-[0_28px_65px_rgba(15,23,42,0.2)]">
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-black/10 via-transparent to-white/25" />
          <CroppedPhoto src={photo.url} sourceKey={photo.key} invitation={invitation} className="aspect-[4/5] w-full object-cover" />

          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/50 to-transparent px-5 pb-5 pt-12">
            <p className="truncate text-center text-[11px] font-medium text-white/90">
              {photo.label}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const PremiumPhotoCarousel = ({ photos, lang, invitation }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!photos || photos.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % photos.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [photos]);

  if (!photos || photos.length < 2) return null;

  const previousIndex = (activeIndex - 1 + photos.length) % photos.length;
  const nextIndex = (activeIndex + 1) % photos.length;
  const activePhoto = photos[activeIndex];
  const previousPhoto = photos[previousIndex];
  const nextPhoto = photos[nextIndex];

  const goTo = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <motion.section
      {...revealProps()}
      className="relative overflow-hidden rounded-[2.75rem] border border-emerald-100 bg-white/80 px-4 py-8 shadow-[0_24px_70px_rgba(16,185,129,0.13)]"
    >
      <div
        className="absolute inset-0 opacity-35 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url("${LEAF_FRAME_URL}")` }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/70 via-white/25 to-white/70" />
      <div className="absolute left-8 top-8 w-20 h-20 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />
      <div className="absolute right-6 bottom-6 w-24 h-24 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-7">
        <h3 className="text-[13px] font-semibold text-emerald-700 text-center">
          {getAlbumTitle(lang)}
        </h3>

        <div className="relative h-[330px] flex items-center justify-center">
          <motion.button
            type="button"
            onClick={() => goTo(previousIndex)}
            className="absolute left-0 top-1/2 z-10 h-44 w-28 -translate-y-1/2 overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-lg"
            initial={false}
            animate={{ x: 0, scale: 0.86, opacity: 0.64, filter: 'blur(1.8px)' }}
            whileTap={{ scale: 0.82 }}
          >
            <CroppedPhoto src={previousPhoto.url} sourceKey={previousPhoto.key} invitation={invitation} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-white/20" />
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePhoto.url}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) goTo(nextIndex);
                if (info.offset.x > 60) goTo(previousIndex);
              }}
              className="relative z-20 w-[74%] max-w-[300px] overflow-hidden rounded-[2.35rem] border-[7px] border-white bg-white shadow-[0_28px_65px_rgba(15,23,42,0.22)]"
            >
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-black/10 via-transparent to-white/25" />
              <CroppedPhoto src={activePhoto.url} sourceKey={activePhoto.key} invitation={invitation} className="aspect-[4/5] w-full object-cover" />

              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/55 to-transparent px-5 pb-5 pt-12">
                <p className="truncate text-center text-[11px] font-medium text-white/90">
                  {activePhoto.label}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => goTo(nextIndex)}
            className="absolute right-0 top-1/2 z-10 h-44 w-28 -translate-y-1/2 overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-lg"
            initial={false}
            animate={{ x: 0, scale: 0.86, opacity: 0.64, filter: 'blur(1.8px)' }}
            whileTap={{ scale: 0.82 }}
          >
            <CroppedPhoto src={nextPhoto.url} sourceKey={nextPhoto.key} invitation={invitation} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-white/20" />
          </motion.button>
        </div>

        <div className="flex justify-center gap-2">
          {photos.map((photo: any, index: number) => (
            <button
              key={`${photo.url}-dot-${index}`}
              type="button"
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-7 bg-emerald-500' : 'w-2 bg-emerald-200'
              }`}
              aria-label={`Photo ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export function GuestView({ invitation }: any) {
  const [isOpened, setIsOpened] = useState(false);
  const [view, setView] = useState<'envelope' | 'content'>('envelope');
  const [isMuted, setIsMuted] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [guests, setGuests] = useState([{ firstName: '', lastName: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOpeningFading, setIsOpeningFading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [openingReplayKey, setOpeningReplayKey] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const openingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const lang = (pick(invitation, ['language']) as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].guest;
  const tBuilder = translations[lang].builder;

  const eventType = pick(invitation, ['event_type', 'eventtype'], 'wedding');
  const emojis = THEME_EMOJIS[eventType] || THEME_EMOJIS.default;

  const planType = pick(invitation, ['plan_type', 'plantype'], 'FREE');
  const planPackage = pick(invitation, ['plan_package', 'planpackage'], '');
  const isPremium = planType === 'PREMIUM';
  // Le pack Business (plan_package) donne accès au Mode personnalisé.
  // Un utilisateur Business a plan_type = 'PREMIUM' ET plan_package = 'business'.
  const isBusiness = planPackage === 'business';

  const openingType = isPremium ? pick(invitation, ['opening_type', 'openingtype'], 'vinyl') : 'vinyl';
  const containerOpen = pick(invitation, ['container_open', 'containeropen'], 'envelope');

  const paperType = pick(invitation, ['paper_type', 'papertype'], 'smooth');
  const paperColor = pick(invitation, ['paper_color', 'papercolor'], '#ffffff');

  const backgroundTheme = pick(invitation, ['background_theme', 'backgroundtheme'], '');
  const backgroundColor = pick(invitation, ['background_color', 'backgroundcolor'], '#ffffff');
  const premiumTriggerType = pick(invitation, ['premium_trigger_type', 'premiumtriggertype'], 'emoji');
  const isPremiumDecor = isPremium && premiumTriggerType === 'decor';

  const fontStyle = pick(invitation, ['font_style', 'fontstyle'], 'inherit');

  const mainPhotoUrl = pick(invitation, ['main_photo_url', 'mainphotourl'], '');
  const photoUrl2 = pick(invitation, ['photo_url_2', 'photourl2'], '');
  const photoUrl3 = pick(invitation, ['photo_url_3', 'photourl3'], '');
  const endPhotoUrl = pick(invitation, ['end_photo_url', 'endphotourl'], '');

  const albumPhotoUrl1 = pick(invitation, ['album_photo_url_1', 'albumphotourl1'], '');
  const albumPhotoUrl2 = pick(invitation, ['album_photo_url_2', 'albumphotourl2'], '');
  const albumPhotoUrl3 = pick(invitation, ['album_photo_url_3', 'albumphotourl3'], '');
  const albumPhotoUrl4 = pick(invitation, ['album_photo_url_4', 'albumphotourl4'], '');
  const albumPhotoUrl5 = pick(invitation, ['album_photo_url_5', 'albumphotourl5'], '');
  const albumPhotoUrl6 = pick(invitation, ['album_photo_url_6', 'albumphotourl6'], '');

  const premiumMidTitle = pick(invitation, ['premium_mid_title'], '');
  const premiumMidText = pick(invitation, ['premium_mid_text'], '');
  const premiumMidPhotoUrl = pick(invitation, ['premium_mid_photo_url'], '');

  const premiumFinalTitle = pick(invitation, ['premium_final_title'], '');
  const premiumFinalText = pick(invitation, ['premium_final_text'], '');
  const premiumFinalPhotoUrl = pick(invitation, ['premium_final_photo_url'], '');

  // Mode personnalisé (Business) : remplace l'image "Powered by" du volet d'ouverture.
  const customBrandingEnabled = pick(invitation, ['custom_branding_enabled', 'custombrandingenabled'], false);
  const customBrandingColor = pick(invitation, ['custom_branding_color', 'custombrandingcolor'], '#FFFFFF');
  const customLogoUrl = pick(invitation, ['custom_logo_url', 'customlogourl'], '');
  const useCustomBranding = isBusiness && Boolean(customBrandingEnabled);

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

  const effectivePaperType = isPremium || paperType === 'smooth' ? paperType : 'smooth';
  const cardPaperColor = isPremium ? paperColor : '#ffffff';
  const pageBackgroundColor = isPremiumDecor && backgroundColor ? backgroundColor : '#ffffff';

  const mainPhotoPosX = pick(invitation, ['main_photo_url_pos_x', 'mainphotourlposx'], 0);
  const mainPhotoPosY = pick(invitation, ['main_photo_url_pos_y', 'mainphotourlposy'], 0);
  const mainPhotoScale = pick(invitation, ['main_photo_url_scale', 'mainphotourlscale'], 1);

  const isVideoOpening = isPremium && containerOpen === 'video';
  const isFreeShutterOpening = !isVideoOpening;
  const openingVideoVisible = isVideoReady && !isOpeningFading;

  const premiumGalleryPhotos = useMemo(() => {
    if (!isPremium) return [];

    return [
      { url: albumPhotoUrl1, label: 'Album 1', key: 'album_photo_url_1' },
      { url: albumPhotoUrl2, label: 'Album 2', key: 'album_photo_url_2' },
      { url: albumPhotoUrl3, label: 'Album 3', key: 'album_photo_url_3' },
      { url: albumPhotoUrl4, label: 'Album 4', key: 'album_photo_url_4' },
      { url: albumPhotoUrl5, label: 'Album 5', key: 'album_photo_url_5' },
      { url: albumPhotoUrl6, label: 'Album 6', key: 'album_photo_url_6' }
    ].filter((photo) => photo.url);
  }, [
    isPremium,
    albumPhotoUrl1,
    albumPhotoUrl2,
    albumPhotoUrl3,
    albumPhotoUrl4,
    albumPhotoUrl5,
    albumPhotoUrl6
  ]);

  useEffect(() => {
    return () => {
      openingTimersRef.current.forEach(clearTimeout);
      openingTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    setIsVideoReady(false);
  }, [openingVideoUrl, openingReplayKey]);

  useEffect(() => {
    setGuests((currentGuests) =>
      Array.from({ length: guestCount }, (_, i) => currentGuests[i] || { firstName: '', lastName: '' })
    );
  }, [guestCount]);

  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, invitation?.music_url]);

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

  const handleReplayOpening = () => {
    openingTimersRef.current.forEach(clearTimeout);
    openingTimersRef.current = [];

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setView('envelope');
    setIsOpened(false);
    setIsOpeningFading(false);
    setIsVideoReady(false);
    setOpeningReplayKey((current) => current + 1);
  };

  const toggleMute = (e: MouseEvent) => {
    e.stopPropagation();

    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const addToCalendar = () => {
    const eventDate = new Date(invitation.event_date);
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const startDate = formatDate(eventDate);
    const endDate = formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000));
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(invitation.title || '')}&dates=${startDate}/${endDate}&location=${encodeURIComponent(invitation.event_address || '')}&details=${encodeURIComponent(invitation.description || '')}`;

    window.open(googleUrl, '_blank');
  };

  const openMaps = () => {
    const address = encodeURIComponent(invitation.event_address || '');
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  };

  const handleRSVP = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('responses').insert([
        {
          invitation_id: invitation.id,
          group_leader_name: `${guests[0].firstName} ${guests[0].lastName}`,
          guest_details: guests,
          total_guests: guestCount
        }
      ]);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const OpeningVideoLayer = () => (
    <motion.div
      key={`opening-layer-${openingReplayKey}`}
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
        key={`${openingVideoUrl}-${openingReplayKey}`}
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

  const FreeShutterLayer = () => (
    <>
      <motion.div
        animate={isOpeningFading ? { y: '-100%', opacity: 0.96 } : { y: '0%', opacity: 1 }}
        transition={{ duration: 0.82, ease: [0.43, 0.13, 0.23, 0.96] }}
        className="absolute inset-0 z-50 w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.42)] border-b border-black/10 bg-cover bg-center"
        style={
          useCustomBranding
            ? {
                backgroundColor: customBrandingColor || '#FFFFFF',
                backgroundImage: customLogoUrl ? `url("${customLogoUrl}")` : undefined,
                backgroundSize: customLogoUrl ? 'auto 38%' : undefined,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }
            : {
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.22)), url("${openingPosterUrl}")`
              }
        }
      />

      <motion.div
        animate={isOpeningFading ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="absolute inset-0 z-50 w-full h-full pointer-events-none"
        style={{
          background: useCustomBranding
            ? 'radial-gradient(circle at 50% 42%, rgba(0,0,0,0.05), transparent 32%)'
            : 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.22), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.18))'
        }}
      />
    </>
  );

  const showEmojiRain = isOpened && (planType !== 'PREMIUM' || premiumTriggerType === 'emoji' || !premiumTriggerType);
  const showPremiumDecor = isOpened && isPremiumDecor;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden touch-none" style={{ fontFamily: fontStyle, backgroundColor: pageBackgroundColor }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}

      {showEmojiRain && <EmojiRain emojis={emojis} />}
      {showPremiumDecor && <AutonomousDecor theme={backgroundTheme} isPremiumDecor={isPremiumDecor} />}

      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
            {isVideoOpening && !isOpened && <OpeningVideoLayer />}

            {isOpened && invitation?.music_url && (
              <button onClick={toggleMute} className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
              </button>
            )}

            {isOpened && isVideoOpening && (
              <button
                type="button"
                onClick={handleReplayOpening}
                className="absolute top-6 left-6 z-[70] h-10 px-3 bg-white/90 rounded-full flex items-center gap-1.5 justify-center shadow-md text-[10px] font-black uppercase tracking-wider text-gray-700"
              >
                <RotateCcw size={14} />
                <span>{getReplayLabel(lang)}</span>
              </button>
            )}

            <motion.div
              initial={{ y: 0, opacity: 0 }}
              animate={isOpened ? { y: openingType === 'filmstrip' ? -160 : -140, opacity: 1 } : { y: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, delay: 0.08 }}
              className="absolute z-20"
            >
              {openingType === 'filmstrip' ? (
                <div className="relative w-44 h-72 bg-[#1a1a1a] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.7),_inset_0_0_30px_rgba(255,255,255,0.08)] rotate-[-2deg] overflow-hidden p-2 border-y-4 border-[#1a1a1a]">
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

            {/* Carte "Voir les détails" avec contour doré animé (sans effet de lumière/lueur) */}
            <motion.div
              initial={{ scale: 0.8, y: 0, opacity: 0 }}
              animate={isOpened ? { scale: 1, y: 80, opacity: 1 } : { y: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, delay: 0.05 }}
              onClick={() => isOpened && setView('content')}
              className={`relative z-30 w-[310px] h-[370px] rounded-[3rem] shadow-2xl p-10 flex flex-col items-center justify-between border-[1.5px] border-amber-300/45 cursor-pointer paper-container ${getPaperClass()}`}
              style={{ '--dynamic-color': cardPaperColor } as CSSProperties}
            >
              {/* Fin liseré doré tournant, très discret, pour un effet "cadre précieux" */}
              <motion.div
                className="absolute -inset-[3px] rounded-[3.2rem] pointer-events-none opacity-60"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(251,191,36,0) 0deg, rgba(251,191,36,0.9) 40deg, rgba(255,255,255,0.9) 70deg, rgba(251,191,36,0.9) 100deg, rgba(251,191,36,0) 160deg, rgba(251,191,36,0) 360deg)',
                  WebkitMask:
                    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  padding: '2px'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              />

              <div className="text-center pt-14 w-full">
                <h2 className="text-2xl font-semibold mb-4 break-words leading-tight" style={{ fontFamily: fontStyle }}>
                  {invitation?.title || tBuilder.title_placeholder}
                </h2>
                <div className="w-8 h-1 bg-amber-400 mx-auto mb-4" />
                <p className="opacity-60 text-[11px] font-medium">{t.tap_open}</p>
              </div>

              <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[12px] font-semibold text-center">
                {getDetailsLabel(lang)}
              </div>
            </motion.div>

            {!isOpened && (
              <div className="absolute inset-0 z-50 overflow-hidden" style={{ perspective: '2200px', transformStyle: 'preserve-3d', pointerEvents: 'auto' }}>
                <motion.div key="gate-container" className="w-full h-full relative flex items-center justify-center">
                  {isVideoOpening && (
                    <motion.div
                      initial={false}
                      animate={isOpeningFading || openingVideoVisible ? { opacity: 0 } : { opacity: 1 }}
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                      className="absolute bottom-12 z-[80] text-white font-semibold text-[12px] animate-pulse text-center w-full px-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] pointer-events-none"
                    >
                      {t.tap_open}
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
                      <p
                        className={`absolute bottom-12 z-[80] font-semibold text-[12px] animate-pulse text-center w-full px-4 ${
                          useCustomBranding
                            ? 'text-gray-800'
                            : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]'
                        }`}
                      >
                        {t.tap_open}
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
            initial={{ opacity: 0, rotateY: -24, scale: 0.94, x: 38 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, rotateY: 18, scale: 0.97, x: -22 }}
            transition={{ duration: CONTENT_TRANSITION_DURATION, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full h-full z-[100] flex flex-col overflow-y-auto paper-container ${getPaperClass()}`}
            style={
              {
                '--dynamic-color': cardPaperColor,
                transformStyle: 'preserve-3d',
                transformOrigin: 'center right'
              } as CSSProperties
            }
          >
            <ContentOrnaments />
            <RevealSweepBar />

            <div className="h-[32%] relative overflow-hidden shrink-0">
              {mainPhotoUrl && (
                <img
                  src={mainPhotoUrl}
                  className="w-full h-full object-cover"
                  style={{ transform: `translate(${mainPhotoPosX}px, ${mainPhotoPosY}px) scale(${mainPhotoScale})` }}
                  alt=""
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent pointer-events-none" />

              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                <X size={20} />
              </button>

              {isVideoOpening && (
                <button
                  type="button"
                  onClick={handleReplayOpening}
                  className="absolute top-6 right-6 h-10 px-3 bg-white/90 rounded-full flex items-center gap-1.5 justify-center shadow-md text-[10px] font-black uppercase tracking-wider text-gray-700"
                >
                  <RotateCcw size={14} />
                  <span>{getReplayLabel(lang)}</span>
                </button>
              )}
            </div>

            <div className="relative flex-1 p-8 space-y-14">
              <motion.div {...revealProps()} className="text-center">
                <h2 className="text-3xl font-semibold mb-4 leading-tight" style={{ fontFamily: fontStyle }}>
                  {invitation?.host_names || tBuilder.hosts_placeholder}
                </h2>

                <motion.div
                  className="w-10 h-[1.5px] bg-amber-400 mx-auto mb-5 origin-center"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                />

                <div className="flex flex-col items-center gap-2 opacity-70 font-medium text-[12px] text-gray-700">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex"
                    >
                      <Calendar size={14} className="text-amber-500" />
                    </motion.span>
                    {invitation.event_date
                      ? new Date(invitation.event_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : t.save_date}
                  </div>

                  <div className="flex items-center gap-2 text-center">
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="flex shrink-0"
                    >
                      <MapPin size={14} className="text-amber-500 shrink-0" />
                    </motion.span>
                    {invitation.event_address || tBuilder.address_placeholder}
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-4">
                  <button onClick={addToCalendar} className="p-3 bg-amber-50 rounded-full shadow-sm active:scale-95 transition-transform">
                    <Calendar size={18} className="text-amber-600" />
                  </button>
                  <button onClick={openMaps} className="p-3 bg-amber-50 rounded-full shadow-sm active:scale-95 transition-transform">
                    <MapPin size={18} className="text-amber-600" />
                  </button>
                </div>
              </motion.div>

              {invitation.description && (
                <motion.div {...revealProps(0.05)} className="text-center italic opacity-85" style={{ fontFamily: fontStyle }}>
                  <p className="text-[14px] leading-relaxed px-4 whitespace-pre-wrap">{invitation.description}</p>
                  <motion.div
                    className="w-12 h-[1px] bg-amber-200 mx-auto mt-6 origin-center"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  />
                </motion.div>
              )}

              <div className="space-y-12">
                <motion.h3 {...revealProps()} className="text-[14px] font-semibold text-amber-600 text-center relative inline-block w-full">
                  {tBuilder.program_title}
                  <motion.span
                    className="block h-[1.5px] bg-amber-400 mx-auto mt-2 origin-center"
                    style={{ width: '32px' }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  />
                </motion.h3>

                <div className="relative flex flex-col items-center">
                  <motion.div
                    className="absolute top-0 w-[2px] h-full bg-gradient-to-b from-amber-100 via-amber-500 to-amber-100 origin-top"
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(245,158,11,0.35)',
                        '0 0 20px rgba(245,158,11,0.65)',
                        '0 0 10px rgba(245,158,11,0.35)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  <div className="relative space-y-12 w-full">
                    {(invitation.event_program || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: isEven ? -22 : 22 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.4 }}
                          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.1, 0.4) }}
                          className={`flex items-center w-full relative ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                        >
                          <div className="w-[45%]">
                            <div className={`overflow-hidden bg-white/65 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-lg ${isEven ? 'text-right' : 'text-left'}`}>
                              {isPremium && step.image_url && (
                                <div className="w-full aspect-video overflow-hidden">
                                  <img
                                    src={step.image_url}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                </div>
                              )}

                              <div className="p-4">
                                <div className="text-[13px] font-medium leading-tight" style={{ fontFamily: fontStyle }}>
                                  {step.activity}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="w-[10%] flex flex-col items-center justify-center gap-2">
                            <div className="text-[10px] font-semibold text-amber-600 leading-none whitespace-nowrap">
                              {step.time}
                            </div>
                            <div className="relative z-10">
                              <div className="w-3 h-3 bg-amber-500 rounded-full ring-4 ring-white shadow-sm" />
                              <motion.div
                                animate={{ scale: [1, 2.2, 1], opacity: [0.45, 0, 0.45] }}
                                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15 }}
                                className="absolute inset-0 rounded-full bg-amber-400"
                              />
                            </div>
                          </div>

                          <div className="w-[45%]" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <PremiumStorySection isPremium={isPremium} title={premiumMidTitle} text={premiumMidText} imageUrl={premiumMidPhotoUrl} imageKey="premium_mid_photo_url" invitation={invitation} fontStyle={fontStyle} />

              {isPremium && premiumGalleryPhotos.length === 1 && <PremiumSingleAlbumPhoto photo={premiumGalleryPhotos[0]} lang={lang} invitation={invitation} />}
              {isPremium && premiumGalleryPhotos.length >= 2 && <PremiumPhotoCarousel photos={premiumGalleryPhotos.slice(0, 6)} lang={lang} invitation={invitation} />}

              {isPremium && endPhotoUrl && (
                <motion.div {...revealProps()} className="px-2">
                  <div className="text-center mb-5">
                    <p className="text-[13px] font-semibold text-amber-600">
                      {getKeepsakeText(lang)}
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-white"
                  >
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
                  </motion.div>
                </motion.div>
              )}

              <PremiumStorySection isPremium={isPremium} title={premiumFinalTitle} text={premiumFinalText} imageUrl={premiumFinalPhotoUrl} imageKey="premium_final_photo_url" invitation={invitation} fontStyle={fontStyle} />

              <motion.div
                {...revealProps()}
                className="relative bg-gray-900 rounded-[3rem] p-8 shadow-2xl border border-amber-300/20 overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_42%)]" />
                <motion.div
                  className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl"
                  animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />

                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="relative z-10 space-y-6">
                    <h3 className="font-semibold text-sm text-white text-center">{t.confirm_rsvp}</h3>

                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/10">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-12 h-12 bg-white/10 text-white rounded-xl font-semibold active:scale-95 transition-transform">
                        -
                      </button>
                      <span className="text-white font-semibold text-2xl">{guestCount}</span>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-12 h-12 bg-white/10 text-white rounded-xl font-semibold active:scale-95 transition-transform">
                        +
                      </button>
                    </div>

                    {guests.map((guest, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3">
                        <input
                          required
                          placeholder={t.first_name}
                          className="bg-white/10 h-12 px-4 rounded-xl text-sm text-white focus:ring-1 ring-amber-400 outline-none placeholder:text-white/35"
                          value={guest.firstName}
                          onChange={(e) => {
                            const n = [...guests];
                            n[i].firstName = e.target.value;
                            setGuests(n);
                          }}
                        />
                        <input
                          required
                          placeholder={t.last_name}
                          className="bg-white/10 h-12 px-4 rounded-xl text-sm text-white focus:ring-1 ring-amber-400 outline-none placeholder:text-white/35"
                          value={guest.lastName}
                          onChange={(e) => {
                            const n = [...guests];
                            n[i].lastName = e.target.value;
                            setGuests(n);
                          }}
                        />
                      </div>
                    ))}

                    <motion.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.97 }} className="w-full h-14 bg-white text-gray-900 rounded-2xl font-semibold text-sm shadow-xl transition-all disabled:opacity-60">
                      {isSubmitting ? '...' : t.send}
                    </motion.button>
                  </form>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }} className="relative z-10 py-8 text-center space-y-4">
                    <CheckCircle2 size={46} className="text-amber-400 mx-auto drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                    <p className="text-white font-semibold text-sm">{t.thank_you}</p>
                    <p className="text-white/45 text-[12px] font-medium">{t.success_msg}</p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
