import { useEffect, useRef } from 'react';

interface SaveTheDateProps {
  eventDate: Date;
  dateIcon: string;
}

export function SaveTheDate({ eventDate, dateIcon }: SaveTheDateProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeIn');
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const renderDateIcon = () => {
    switch (dateIcon) {
      case 'heart':
        return '❤️';
      case 'circle':
        return '⭕';
      case 'emoji':
        return '✨';
      default:
        return '❤️';
    }
  };

  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('en-US', { month: 'long' });
  const year = eventDate.getFullYear();
  const dayOfWeek = eventDate.toLocaleString('en-US', { weekday: 'long' });

  return (
    <div
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-4 py-16 sm:py-20 bg-gradient-to-br from-white via-rose-50 to-white scroll-reveal"
    >
      <div className="max-w-2xl w-full">
        <div className="text-center">
          <p className="text-gray-600 text-xs sm:text-sm uppercase tracking-[0.2em] mb-6 sm:mb-8 font-light">
            Save the Date
          </p>

          <div className="bg-white/60 backdrop-blur-glass rounded-3xl p-8 sm:p-12 shadow-xl border border-white/20">
            <div className="space-y-6 sm:space-y-8">
              <div className="text-5xl sm:text-7xl animate-bounce">
                {renderDateIcon()}
              </div>

              <div>
                <div className="text-lg sm:text-2xl text-gray-600 font-light mb-2">
                  {dayOfWeek}
                </div>
                <div className="text-5xl sm:text-7xl font-serif font-light text-gray-800 mb-2">
                  {day}
                </div>
                <div className="text-2xl sm:text-3xl text-gray-700 font-light mb-2">
                  {month}
                </div>
                <div className="text-lg sm:text-2xl text-gray-600 font-light">
                  {year}
                </div>
              </div>

              <div className="pt-6 sm:pt-8 border-t border-gray-200">
                <div className="flex justify-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-amber-400"
                      style={{
                        animation: `pulse 2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
