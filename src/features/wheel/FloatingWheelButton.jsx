import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

const POSITION_STORAGE_KEY = 'wheel_button_position';
const COLLAPSED_STORAGE_KEY = 'wheel_button_collapsed';

// Taille "large" (roue dépliée) : on prend la valeur desktop (sm:w-20 h-20 =
// 80px) comme marge de sécurité pour le clamp, même sur mobile où le bouton
// est un peu plus petit visuellement (64px) — mieux vaut une marge trop
// prudente qu'un bouton qui dépasse de l'écran.
const EXPANDED_SIZE = 80;
// Taille "rangée" : une petite pastille discrète collée au bord.
const COLLAPSED_SIZE = 48;
const EDGE_MARGIN = 16;

const clampPosition = (position, size) => {
  if (typeof window === 'undefined') return position;

  return {
    x: Math.min(Math.max(EDGE_MARGIN, position.x), window.innerWidth - size - EDGE_MARGIN),
    y: Math.min(Math.max(EDGE_MARGIN, position.y), window.innerHeight - size - EDGE_MARGIN)
  };
};

const snapToEdge = (position, size) => {
  if (typeof window === 'undefined') return position;

  const clamped = clampPosition(position, size);
  const middle = window.innerWidth / 2;
  const shouldSnapLeft = clamped.x + size / 2 < middle;

  return {
    x: shouldSnapLeft ? EDGE_MARGIN : window.innerWidth - size - EDGE_MARGIN,
    y: clamped.y
  };
};

const getInitialPosition = (size) => {
  if (typeof window === 'undefined') return { x: 24, y: 400 };

  const saved = localStorage.getItem(POSITION_STORAGE_KEY);

  if (saved) {
    try {
      return snapToEdge(JSON.parse(saved), size);
    } catch {
      // Valeur corrompue : on retombe sur la position par défaut ci-dessous.
    }
  }

  // Position par défaut : bas-droite, comme l'ancien bouton fixe.
  return {
    x: window.innerWidth - size - EDGE_MARGIN,
    y: window.innerHeight - size - EDGE_MARGIN
  };
};

const getInitialCollapsed = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
};

export function FloatingWheelButton({ onClick }) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);
  const [position, setPosition] = useState(() => getInitialPosition(getInitialCollapsed() ? COLLAPSED_SIZE : EXPANDED_SIZE));
  const [isDragging, setIsDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const currentSize = isCollapsed ? COLLAPSED_SIZE : EXPANDED_SIZE;

  useEffect(() => {
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    } catch {
      // Stockage indisponible (navigation privée, quota atteint...) : sans
      // conséquence, la position repartira juste de son défaut au prochain
      // chargement.
    }
  }, [position]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(isCollapsed));
    } catch {
      // idem
    }
  }, [isCollapsed]);

  // Quand on plie/déplie, ou que la fenêtre est redimensionnée, on se
  // recale contre le bord le plus proche pour ne jamais dépasser de l'écran
  // ni se retrouver à moitié caché sans l'avoir voulu.
  useEffect(() => {
    setPosition((current) => snapToEdge(current, currentSize));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed]);

  useEffect(() => {
    const handleResize = () => setPosition((current) => snapToEdge(current, currentSize));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSize]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event) => {
      const next = clampPosition(
        {
          x: event.clientX - dragOffsetRef.current.x,
          y: event.clientY - dragOffsetRef.current.y
        },
        currentSize
      );
      setWasDragged(true);
      setPosition(next);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setPosition((current) => snapToEdge(current, currentSize));
      if ('vibrate' in navigator) navigator.vibrate?.(12);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, currentSize]);

  const handlePointerDown = (event) => {
    setIsDragging(true);
    setWasDragged(false);
    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y
    };
  };

  const handleMainClick = () => {
    if (wasDragged) return;
    onClick();
  };

  const handleExpandClick = () => {
    if (wasDragged) return;
    setIsCollapsed(false);
  };

  const handleCollapseClick = (event) => {
    event.stopPropagation();
    setIsCollapsed(true);
  };

  const stopDragPropagation = (event) => {
    // Empêche le bouton "ranger" de démarrer un glissement sur le
    // conteneur parent quand on ne veut que le cliquer.
    event.stopPropagation();
  };

  const wrapperStyle = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    left: 0,
    top: 0,
    touchAction: 'none',
    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
  };

  // --- État "rangé" : petite pastille discrète, collée au bord ---
  if (isCollapsed) {
    return (
      <motion.button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleExpandClick}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        style={{ ...wrapperStyle, width: COLLAPSED_SIZE, height: COLLAPSED_SIZE }}
        className={`fixed z-[410] rounded-full bg-white border-2 border-amber-300 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing ${
          isDragging ? 'scale-105' : ''
        }`}
        aria-label="Afficher la roue de la chance"
      >
        <Sparkles className="w-5 h-5 text-amber-500" />
      </motion.button>
    );
  }

  // --- État déplié : la roue complète, avec son petit bouton "ranger" ---
  return (
    <div
      onPointerDown={handlePointerDown}
      style={{ ...wrapperStyle, width: EXPANDED_SIZE, height: EXPANDED_SIZE }}
      className={`fixed z-[410] w-16 h-16 sm:w-20 sm:h-20 cursor-grab active:cursor-grabbing ${isDragging ? 'scale-105' : ''}`}
    >
      <button
        type="button"
        onPointerDown={stopDragPropagation}
        onClick={handleCollapseClick}
        className="absolute -top-1.5 -right-1.5 z-20 w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:scale-110 transition-all"
        aria-label="Ranger la roue de la chance"
      >
        <X size={12} />
      </button>

      <motion.button
        type="button"
        onClick={handleMainClick}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 0.4 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative w-full h-full"
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
    </div>
  );
}
