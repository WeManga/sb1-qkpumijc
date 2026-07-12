import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SEGMENTS = [
  { label: '50', color: '#FCD34D' },
  { label: '100', color: '#F59E0B' },
  { label: '200', color: '#EA580C' },
  { label: '50', color: '#FCD34D' },
  { label: 'Perdu', color: '#D1D5DB' },
  { label: '100', color: '#F59E0B' },
  { label: '500', color: '#DC2626' },
  { label: '50', color: '#FCD34D' },
  { label: 'Rejouer', color: '#8B5CF6' },
  { label: '200', color: '#EA580C' },
  { label: '100', color: '#F59E0B' },
  { label: '50', color: '#FCD34D' }
];

const SEGMENT_ANGLE = 360 / SEGMENTS.length;

function Confetti() {
  const particles = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const distance = 120 + Math.random() * 80;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        const colors = ['#FCD34D', '#F59E0B', '#EA580C', '#DC2626', '#8B5CF6', '#FFFFFF'];
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
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
  const [error, setError] = useState('');
  const spinCount = useRef(0);

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
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
      const fullTurns = 5 + spinCount.current;
      const finalRotation = fullTurns * 360 + (360 - targetAngle) - SEGMENT_ANGLE / 2;

      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setResult(data.prize);
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
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          className="relative w-full max-w-sm bg-gradient-to-b from-amber-50 to-white rounded-[2.5rem] shadow-2xl p-6 pt-10 overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/80 rounded-full text-gray-500 shadow-sm"
          >
            <X size={16} />
          </button>

          <h2 className="text-center text-xl font-black text-gray-900 uppercase tracking-tight mb-1">
            Roue de la Chance
          </h2>
          <p className="text-center text-[11px] text-amber-600 font-bold uppercase tracking-widest mb-6">
            Tentez de gagner des pièces
          </p>

          <div className="relative w-64 h-64 mx-auto mb-8">
            <div className="absolute -inset-4 rounded-full bg-amber-300/30 blur-2xl animate-pulse" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-rose-600 drop-shadow-lg" />

            <motion.svg
              viewBox="0 0 200 200"
              className="relative z-10 w-full h-full drop-shadow-2xl"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.17, 0.67, 0.35, 0.99] }}
            >
              {SEGMENTS.map((seg, i) => {
                const startAngle = i * SEGMENT_ANGLE;
                const endAngle = startAngle + SEGMENT_ANGLE;
                const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
                const x1 = 100 + 95 * Math.cos(toRad(startAngle));
                const y1 = 100 + 95 * Math.sin(toRad(startAngle));
                const x2 = 100 + 95 * Math.cos(toRad(endAngle));
                const y2 = 100 + 95 * Math.sin(toRad(endAngle));
                const midAngle = startAngle + SEGMENT_ANGLE / 2;
                const textX = 100 + 62 * Math.cos(toRad(midAngle));
                const textY = 100 + 62 * Math.sin(toRad(midAngle));

                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A95,95 0 0,1 ${x2},${y2} Z`}
                      fill={seg.color}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize={seg.label.length > 4 ? '8' : '13'}
                      fontWeight="900"
                      textAnchor="middle"
                      transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="14" fill="white" stroke="#FCD34D" strokeWidth="3" />
            </motion.svg>

            {result && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Confetti />
              </div>
            )}
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full h-14 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {spinning ? 'La roue tourne...' : (
              <>
                <Sparkles size={18} />
                Tourner la roue
              </>
            )}
          </button>

          {error && (
            <p className="text-center text-rose-500 text-xs font-bold mt-4">{error}</p>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="mt-5 text-center p-4 bg-amber-50 border border-amber-100 rounded-2xl"
              >
                <p className="text-sm font-black text-gray-900">
                  {result.prize_type === 'coins' && `🎉 Vous gagnez ${result.coin_value} pièces !`}
                  {result.prize_type === 'retry' && '🔄 Vous pouvez rejouer !'}
                  {result.prize_type === 'nothing' && '😅 Pas de chance cette fois...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
