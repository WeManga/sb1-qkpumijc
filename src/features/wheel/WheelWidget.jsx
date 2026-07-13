import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SEGMENTS = [
  { label: '50', color: '#FCD34D' },
  { label: '100', color: '#F59E0B' },
  { label: '200', color: '#EA580C' },
  { label: '50', color: '#FCD34D' },
  { label: 'Perdu', color: '#9CA3AF' },
  { label: '100', color: '#F59E0B' },
  { label: '500', color: '#DC2626' },
  { label: '50', color: '#FCD34D' },
  { label: 'Rejouer', color: '#8B5CF6' },
  { label: '200', color: '#EA580C' },
  { label: '100', color: '#F59E0B' },
  { label: '50', color: '#FCD34D' }
];

const SEGMENT_ANGLE = 360 / SEGMENTS.length;
const FIREWORK_COLORS = ['#FCD34D', '#F59E0B', '#EA580C', '#DC2626', '#8B5CF6', '#3B82F6', '#10B981', '#FFFFFF'];

function FireworksBurst({ originX = 50, originY = 45, delay = 0 }) {
  const particles = Array.from({ length: 26 });
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${originX}%`, top: `${originY}%` }}
    >
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
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}`,
              marginLeft: -size / 2,
              marginTop: -size / 2
            }}
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
            style={{
              width: w,
              height: w * 1.6,
              backgroundColor: color,
              borderRadius: 2
            }}
          />
        );
      })}
    </div>
  );
}

export function WheelWidget({ isOpen, onClose, onWin }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState('');
  const spinCount = useRef(0);

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setShowCelebration(false);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('spin-wheel');

      if (fnError || !data?.ok) {
        throw new Error(data?.error || fnError?.message || 'Erreur de tirage');
      }

      const winningLabel = data.prize.prize_type === 'coins'
        ? String(data.prize.coin_value)
        : data.prize.prize_type === 'retry'
          ? 'Rejouer'
          : 'Perdu';

      const segmentIndex = SEGMENTS.findIndex((s, idx) => {
        return s.label === winningLabel && idx === data.prize.sort_order;
      });

      const targetIndex = segmentIndex >= 0 ? segmentIndex : SEGMENTS.findIndex(s => s.label === winningLabel);
      const targetAngle = targetIndex * SEGMENT_ANGLE;

      spinCount.current += 1;
      const fullTurns = 6 + spinCount.current;
      const finalRotation = fullTurns * 360 + (360 - targetAngle) - SEGMENT_ANGLE / 2;

      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setResult(data.prize);
        if (data.prize.prize_type === 'coins' || data.prize.prize_type === 'retry') {
          setShowCelebration(true);
        }
        onWin?.(data);
      }, 4200);
    } catch (err) {
      setSpinning(false);
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden">
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
          className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X size={18} />
        </button>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative flex flex-col items-center px-4"
        >
          <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px]">
            <motion.div
              className="absolute -inset-6 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(252,211,77,0.35) 0%, transparent 70%)' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-white drop-shadow-lg" />

            <motion.button
              onClick={handleSpin}
              disabled={spinning}
              whileHover={!spinning ? { scale: 1.02 } : {}}
              whileTap={!spinning ? { scale: 0.97 } : {}}
              className="relative z-10 w-full h-full rounded-full disabled:cursor-not-allowed"
              style={{ filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.5))' }}
            >
              <motion.svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.17, 0.67, 0.35, 0.99] }}
              >
                {SEGMENTS.map((seg, i) => {
                  const startAngle = i * SEGMENT_ANGLE;
                  const endAngle = startAngle + SEGMENT_ANGLE;
                  const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
                  const x1 = 100 + 96 * Math.cos(toRad(startAngle));
                  const y1 = 100 + 96 * Math.sin(toRad(startAngle));
                  const x2 = 100 + 96 * Math.cos(toRad(endAngle));
                  const y2 = 100 + 96 * Math.sin(toRad(endAngle));
                  const midAngle = startAngle + SEGMENT_ANGLE / 2;
                  const textX = 100 + 64 * Math.cos(toRad(midAngle));
                  const textY = 100 + 64 * Math.sin(toRad(midAngle));

                  return (
                    <g key={i}>
                      <path
                        d={`M100,100 L${x1},${y1} A96,96 0 0,1 ${x2},${y2} Z`}
                        fill={seg.color}
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize={seg.label.length > 4 ? '8' : '14'}
                        fontWeight="900"
                        textAnchor="middle"
                        transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="18" fill="white" stroke="#FCD34D" strokeWidth="4" />
              </motion.svg>

              {!spinning && !result && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  <span className="text-white text-[11px] font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full">
                    Touchez pour tourner
                  </span>
                </motion.div>
              )}
            </motion.button>
          </div>

          <div className="mt-6 min-h-[64px] flex items-center justify-center">
            {spinning && (
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest animate-pulse">
                La roue tourne...
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
                    {result.prize_type === 'coins' && `+${result.coin_value} pièces !`}
                    {result.prize_type === 'retry' && 'Rejouez !'}
                    {result.prize_type === 'nothing' && 'Pas de chance...'}
                  </p>
                  <button
                    onClick={handleSpin}
                    className="mt-3 text-[11px] font-black uppercase tracking-widest text-amber-300 hover:text-amber-200"
                  >
                    Fermer et continuer
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
