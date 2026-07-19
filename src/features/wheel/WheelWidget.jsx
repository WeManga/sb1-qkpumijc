import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate as animateMotionValue } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/i18n';

const BRAND_FONT_LINK_ID = 'invit-studio-brand-font';

const SEGMENTS_COUNT = 12;
const SEGMENT_ANGLE = 360 / SEGMENTS_COUNT;
const FIREWORK_COLORS = ['#FCD34D', '#F59E0B', '#EA580C', '#DC2626', '#8B5CF6', '#3B82F6', '#10B981', '#FFFFFF'];

const getSpecialLabels = (lang) => {
  if (lang === 'en') return { lost: 'Lost', retry: 'Retry' };
  if (lang === 'vi') return { lost: 'Mất lượt', retry: 'Quay lại' };
  return { lost: 'Perdu', retry: 'Rejouer' };
};

const buildSegments = (lang) => {
  const { lost, retry } = getSpecialLabels(lang);
  return [
    { label: '50', color: '#FCD34D' },
    { label: '100', color: '#F59E0B' },
    { label: '200', color: '#EA580C' },
    { label: '50', color: '#FCD34D' },
    { label: lost, color: '#6B7280' },
    { label: '100', color: '#F59E0B' },
    { label: '500', color: '#DC2626' },
    { label: '50', color: '#FCD34D' },
    { label: retry, color: '#8B5CF6' },
    { label: '200', color: '#EA580C' },
    { label: '100', color: '#F59E0B' },
    { label: '50', color: '#FCD34D' }
  ];
};

const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

function FireworksBurst({ originX = 50, originY = 45, delay = 0 }) {
  const particles = Array.from({ length: 26 });
  return (
    <div className="absolute pointer-events-none" style={{ left: `${originX}%`, top: `${originY}%` }}>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360 + Math.random() * 10;
        const distance = 90 + Math.random() * 140;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
        const size = 3 + Math.random() * 4;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x, y, opacity: [1, 1, 0], scale: [0, 1, 0.5] }}
            transition={{ duration: 1.3 + Math.random() * 0.4, delay, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 6px ${color}`, marginLeft: -size / 2, marginTop: -size / 2 }}
          />
        );
      })}
    </div>
  );
}

function ConfettiRain() {
  const pieces = Array.from({ length: 40 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 2.2 + Math.random() * 1.4;
        const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
        const rotate = Math.random() * 360;
        const w = 6 + Math.random() * 5;
        return (
          <motion.span
            key={i}
            initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: '110vh', rotate: rotate + 360, opacity: [1, 1, 0.3] }}
            transition={{ duration, delay, ease: 'easeIn' }}
            className="absolute top-0"
            style={{ width: w, height: w * 1.6, backgroundColor: color, borderRadius: 2 }}
          />
        );
      })}
    </div>
  );
}

// Couronne de petites loupiotes façon fête foraine, tout autour de la roue.
function MarqueeLights({ active }) {
  const lights = Array.from({ length: 18 });
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
      {lights.map((_, i) => {
        const angle = (i / lights.length) * 360;
        const x = 50 + 51.5 * Math.cos(toRad(angle));
        const y = 50 + 51.5 * Math.sin(toRad(angle));
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={1.4}
            fill="#FDE68A"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{
              duration: active ? 0.9 : 1.8,
              repeat: Infinity,
              delay: i * (active ? 0.05 : 0.09),
              ease: 'easeInOut'
            }}
          />
        );
      })}
    </svg>
  );
}

// Petit loquet doré qui "flique" au passage de chaque séparation de segment,
// entraîné directement par l'angle de rotation (rapide quand la roue tourne vite,
// ralentit avec elle jusqu'à l'arrêt).
function WheelPeg({ pegRotate }) {
  return (
    <motion.div
      className="absolute -top-1 left-1/2 z-30"
      style={{ x: '-50%', rotate: pegRotate, transformOrigin: '50% 6px' }}
    >
      <svg width="26" height="32" viewBox="0 0 26 32" className="drop-shadow-lg">
        <path d="M13 32 L2 7 A11 9 0 0 1 24 7 Z" fill="#ffffff" stroke="#FCD34D" strokeWidth="1.6" />
        <circle cx="13" cy="9" r="3.1" fill="#FCD34D" />
      </svg>
    </motion.div>
  );
}

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WheelWidget({ isOpen, onClose, onWin, lang = 'en' }) {
  const { user } = useAuth();
  const t = translations[lang]?.wheel || translations.en.wheel;

  const SEGMENTS = useMemo(() => buildSegments(lang), [lang]);
  const specialLabels = useMemo(() => getSpecialLabels(lang), [lang]);

  const rotationMV = useMotionValue(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState('');
  const [nextAvailableAt, setNextAvailableAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const spinCount = useRef(0);
  const lastSegRef = useRef(0);
  const wheelAnimationRef = useRef(null);

  const pegRotate = useTransform(rotationMV, (r) => {
    const mod = ((r % SEGMENT_ANGLE) + SEGMENT_ANGLE) % SEGMENT_ANGLE;
    const progress = mod / SEGMENT_ANGLE;
    return -16 * Math.pow(1 - progress, 3);
  });

  useEffect(() => {
    if (!document.getElementById(BRAND_FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = BRAND_FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    checkAvailability();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !nextAvailableAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen, nextAvailableAt]);

  useEffect(() => {
    return () => {
      wheelAnimationRef.current?.stop();
    };
  }, []);

  const checkAvailability = async () => {
    if (!user) return;
    const { data: wallet } = await supabase
      .from('wallets')
      .select('bonus_spins')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: lastFreeSpin } = await supabase
      .from('wheel_spins')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('used_bonus_spin', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const hasBonusSpin = (wallet?.bonus_spins ?? 0) > 0;

    if (lastFreeSpin && !hasBonusSpin) {
      const next = new Date(lastFreeSpin.created_at).getTime() + 24 * 60 * 60 * 1000;
      if (next > Date.now()) {
        setNextAvailableAt(next);
        return;
      }
    }
    setNextAvailableAt(null);
  };

  const remainingMs = nextAvailableAt ? nextAvailableAt - now : 0;
  const isOnCooldown = nextAvailableAt && remainingMs > 0;

  const handleSpin = async () => {
    if (spinning || isOnCooldown) return;
    setSpinning(true);
    setResult(null);
    setShowCelebration(false);
    setError('');

    if ('vibrate' in navigator) navigator.vibrate?.(10);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('spin-wheel');

      if (fnError || !data?.ok) {
        if (data?.nextAvailableAt) {
          setNextAvailableAt(new Date(data.nextAvailableAt).getTime());
        }
        throw new Error(data?.error || fnError?.message || 'Erreur de tirage');
      }

      const winningLabel = data.prize.prize_type === 'coins'
        ? String(data.prize.coin_value)
        : data.prize.prize_type === 'retry'
          ? specialLabels.retry
          : specialLabels.lost;

      const segmentIndex = SEGMENTS.findIndex((s, idx) => s.label === winningLabel && idx === data.prize.sort_order);
      const targetIndex = segmentIndex >= 0 ? segmentIndex : SEGMENTS.findIndex(s => s.label === winningLabel);
      const targetAngle = targetIndex * SEGMENT_ANGLE;

      spinCount.current += 1;
      const fullTurns = 6 + spinCount.current;
      const finalRotation = fullTurns * 360 + (360 - targetAngle) - SEGMENT_ANGLE / 2;

      const startRotation = rotationMV.get();
      lastSegRef.current = Math.floor((((startRotation % 360) + 360) % 360) / SEGMENT_ANGLE);

      wheelAnimationRef.current?.stop();
      wheelAnimationRef.current = animateMotionValue(
        rotationMV,
        [startRotation, startRotation - 14, finalRotation],
        {
          duration: 3.6,
          times: [0, 0.045, 1],
          ease: ['easeOut', [0.16, 0.7, 0.14, 1]],
          onUpdate: (latest) => {
            const currentSeg = Math.floor((((latest % 360) + 360) % 360) / SEGMENT_ANGLE);
            if (currentSeg !== lastSegRef.current) {
              lastSegRef.current = currentSeg;
              if ('vibrate' in navigator) navigator.vibrate?.(5);
            }
          },
          onComplete: () => {
            setSpinning(false);
            setResult(data.prize);
            if (data.prize.prize_type === 'coins' || data.prize.prize_type === 'retry') {
              setShowCelebration(true);
            }
            if (data.nextAvailableAt) {
              setNextAvailableAt(new Date(data.nextAvailableAt).getTime());
            }
            onWin?.(data);
          }
        }
      );
    } catch (err) {
      setSpinning(false);
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            background:
              'radial-gradient(circle at 50% 18%, rgba(217,119,6,0.35), rgba(28,17,8,0.94) 46%, rgba(10,8,7,0.98) 78%)'
          }}
          onClick={onClose}
        />

        {showCelebration && (
          <>
            <ConfettiRain />
            <FireworksBurst originX={30} originY={30} delay={0} />
            <FireworksBurst originX={70} originY={35} delay={0.25} />
            <FireworksBurst originX={50} originY={20} delay={0.5} />
          </>
        )}

        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-amber-400/25 border border-white/10 rounded-full text-white transition-colors"
        >
          <X size={18} />
        </button>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="relative flex flex-col items-center px-6 py-8 sm:px-8 sm:py-9 rounded-[3rem] border border-amber-300/20 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))'
          }}
        >
          <div className="text-center mb-3 sm:mb-4">
            <p
              className="text-3xl sm:text-4xl leading-none"
              style={{
                fontFamily: '"Great Vibes", cursive',
                fontWeight: 400,
                color: '#f2c879',
                textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 0 22px rgba(251,191,36,0.25)'
              }}
            >
              Invit Studio
            </p>
            <p className="mt-1 text-white text-xs sm:text-sm font-black uppercase tracking-[0.55em]">
              Win
            </p>
          </div>

          <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]">
            <motion.div
              className="absolute -inset-6 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(252,211,77,0.4) 0%, transparent 70%)' }}
              animate={{ opacity: spinning ? [0.55, 1, 0.55] : [0.4, 0.75, 0.4] }}
              transition={{ duration: spinning ? 0.9 : 2.2, repeat: Infinity }}
            />

            <div className="absolute -inset-2">
              <MarqueeLights active={spinning} />
            </div>

            <WheelPeg pegRotate={pegRotate} />

            <motion.button
              onClick={handleSpin}
              disabled={spinning || isOnCooldown}
              whileHover={!spinning && !isOnCooldown ? { scale: 1.02 } : {}}
              whileTap={!spinning && !isOnCooldown ? { scale: 0.97 } : {}}
              className="relative z-10 w-full h-full rounded-full disabled:cursor-not-allowed"
              style={{
                filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.5))',
                opacity: isOnCooldown ? 0.45 : 1
              }}
            >
              <motion.svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                style={{ rotate: rotationMV }}
              >
                {SEGMENTS.map((seg, i) => {
                  const startAngle = i * SEGMENT_ANGLE;
                  const endAngle = startAngle + SEGMENT_ANGLE;
                  const x1 = 100 + 96 * Math.cos(toRad(startAngle));
                  const y1 = 100 + 96 * Math.sin(toRad(startAngle));
                  const x2 = 100 + 96 * Math.cos(toRad(endAngle));
                  const y2 = 100 + 96 * Math.sin(toRad(endAngle));
                  const midAngle = startAngle + SEGMENT_ANGLE / 2;
                  const textX = 100 + 64 * Math.cos(toRad(midAngle));
                  const textY = 100 + 64 * Math.sin(toRad(midAngle));

                  return (
                    <g key={i}>
                      <path d={`M100,100 L${x1},${y1} A96,96 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth="1.5" />
                      <text
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize={seg.label.length > 4 ? '8' : '14'}
                        fontWeight="900"
                        textAnchor="middle"
                        transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="18" fill="white" stroke="#FCD34D" strokeWidth="4" />
              </motion.svg>

              {!spinning && !result && !isOnCooldown && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  <span className="text-white text-[11px] font-black uppercase tracking-widest bg-black/40 border border-amber-300/30 px-3 py-1.5 rounded-full">
                    {t.tap_to_spin}
                  </span>
                </motion.div>
              )}

              {isOnCooldown && !result && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                  <Clock className="w-7 h-7 text-white" />
                  <span className="text-white text-lg font-black tracking-widest bg-black/50 px-3 py-1 rounded-full">
                    {formatCountdown(remainingMs)}
                  </span>
                </div>
              )}
            </motion.button>
          </div>

          <div className="mt-6 min-h-[64px] flex items-center justify-center">
            {spinning && (
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest animate-pulse">
                {t.spinning}
              </p>
            )}

            {isOnCooldown && !spinning && !result && (
              <p className="text-white/70 text-xs font-bold text-center max-w-xs">
                {t.cooldown_prefix} {formatCountdown(remainingMs)} {t.cooldown_suffix}
              </p>
            )}

            {error && (
              <p className="text-rose-400 text-xs font-bold text-center max-w-xs">{error}</p>
            )}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ y: 16, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 16, opacity: 0 }}
                  transition={{ type: 'spring', damping: 14 }}
                  className="text-center"
                >
                  <p className="text-2xl font-black text-white drop-shadow-lg">
                    {result.prize_type === 'coins' && `+${result.coin_value} ${t.win_coins_suffix}`}
                    {result.prize_type === 'retry' && t.win_retry}
                    {result.prize_type === 'nothing' && t.win_nothing}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-3 text-[11px] font-black uppercase tracking-widest text-amber-300 hover:text-amber-200"
                  >
                    {t.close}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
