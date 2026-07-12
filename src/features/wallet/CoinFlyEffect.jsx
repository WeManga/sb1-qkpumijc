import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

export function CoinFlyEffect({ origin, target, count = 10, onComplete }) {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    if (!origin || !target) return;
    setCoins(Array.from({ length: count }, (_, i) => i));
    const timer = setTimeout(() => onComplete?.(), 1100 + count * 40);
    return () => clearTimeout(timer);
  }, [origin, target, count, onComplete]);

  if (!origin || !target) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[600]">
      <AnimatePresence>
        {coins.map((i) => {
          const spreadX = (Math.random() - 0.5) * 60;
          const spreadY = (Math.random() - 0.5) * 40;
          return (
            <motion.div
              key={i}
              initial={{ x: origin.x + spreadX, y: origin.y + spreadY, opacity: 1, scale: 1 }}
              animate={{ x: target.x, y: target.y, opacity: [1, 1, 0], scale: [1, 1.2, 0.4] }}
              transition={{ duration: 0.9, delay: i * 0.04, ease: [0.3, 0.6, 0.4, 1] }}
              className="absolute -ml-3 -mt-3 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg"
            >
              <Coins className="w-3.5 h-3.5 text-white" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
