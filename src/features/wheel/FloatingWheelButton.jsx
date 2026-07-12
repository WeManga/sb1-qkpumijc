import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function FloatingWheelButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, delay: 0.4 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-6 right-6 z-[410] w-16 h-16 sm:w-20 sm:h-20"
      aria-label="Roue de la chance"
    >
      <span className="absolute -inset-3 rounded-full bg-amber-400/30 blur-xl animate-pulse" />

      <motion.span
        className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-rose-500 opacity-70"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{ filter: 'blur(2px)' }}
      />

      <motion.div
        className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-rose-500 shadow-2xl border-4 border-white flex items-center justify-center overflow-hidden"
        animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-90">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            const colors = ['#FCD34D', '#F59E0B', '#EA580C', '#DC2626'];
            const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
            const x1 = 50 + 48 * Math.cos(toRad(angle));
            const y1 = 50 + 48 * Math.sin(toRad(angle));
            const x2 = 50 + 48 * Math.cos(toRad(angle + 45));
            const y2 = 50 + 48 * Math.sin(toRad(angle + 45));
            return (
              <path key={i} d={`M50,50 L${x1},${y1} A48,48 0 0,1 ${x2},${y2} Z`} fill={colors[i % colors.length]} />
            );
          })}
          <circle cx="50" cy="50" r="10" fill="white" />
        </svg>
        <Sparkles className="relative z-10 w-6 h-6 text-white drop-shadow" />
      </motion.div>

      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-amber-200"
          animate={{
            x: [0, Math.cos((i * 120 * Math.PI) / 180) * 34],
            y: [0, Math.sin((i * 120 * Math.PI) / 180) * 34],
            opacity: [1, 0],
            scale: [1, 0.3]
          }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
        />
      ))}
    </motion.button>
  );
}
