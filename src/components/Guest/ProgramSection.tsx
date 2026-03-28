import { useEffect, useRef, useState } from 'react';

interface ProgramItem {
  time: string;
  activity: string;
}

interface ProgramSectionProps {
  program: ProgramItem[];
}

export function ProgramSection({ program }: ProgramSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(Array(program.length).fill(false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          program.forEach((_, index) => {
            setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }, index * 200);
          });
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [program.length]);

  if (program.length === 0) return null;

  return (
    <div
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-4 py-16 sm:py-20 bg-gradient-to-br from-white via-rose-50 to-white"
    >
      <div className="max-w-2xl w-full">
        <p className="text-center text-gray-600 text-xs sm:text-sm uppercase tracking-[0.2em] mb-8 sm:mb-12 font-light">
          Program of Events
        </p>

        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-300 to-amber-300"></div>

          <div className="space-y-8 sm:space-y-12">
            {program.map((item, index) => (
              <div
                key={index}
                className={`relative transition-all duration-1000 transform ${
                  visibleItems[index]
                    ? 'opacity-100 translate-x-0'
                    : index % 2 === 0
                    ? 'opacity-0 -translate-x-8'
                    : 'opacity-0 translate-x-8'
                }`}
              >
                <div className={`flex gap-4 sm:gap-8 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1 hidden sm:block">
                    <div className="text-right text-gray-600 font-light mb-2 text-sm">
                      {item.time}
                    </div>
                  </div>

                  <div className="relative flex justify-center flex-shrink-0">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-rose-400 to-amber-400 border-2 sm:border-4 border-white shadow-lg"></div>
                  </div>

                  <div className="flex-1">
                    <div className="bg-white/60 backdrop-blur-glass rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
                      <div className="text-xs sm:text-sm text-gray-600 font-light sm:hidden mb-1">
                        {item.time}
                      </div>
                      <p className="text-gray-800 font-light text-sm sm:text-base">
                        {item.activity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
