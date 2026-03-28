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
            // RALENTI : de 200ms à 800ms par item pour apprécier l'effet
            setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }, index * 800); 
          });
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [program.length]);

  if (program.length === 0) return null;

  return (
    <div ref={sectionRef} className="px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mb-16">
          Déroulement de la journée
        </p>

        <div className="relative">
          {/* Ligne centrale d'or */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-200 opacity-50"></div>

          <div className="space-y-16">
            {program.map((item, index) => (
              <div
                key={index}
                className={`relative transition-all duration-[1500ms] transform ${
                  visibleItems[index]
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-95'
                }`}
              >
                <div className={`flex items-center gap-8 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1 text-center sm:text-left">
                     <div className={`bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50 ${index % 2 === 0 ? 'border-r-amber-300 border-r-4' : 'border-l-amber-300 border-l-4'}`}>
                        <span className="text-amber-600 font-black text-xs block mb-1">{item.time}</span>
                        <p className="text-gray-800 font-bold text-sm tracking-tight">{item.activity}</p>
                     </div>
                  </div>

                  {/* Le point central */}
                  <div className="relative flex justify-center flex-shrink-0 z-10">
                    <div className="w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-md"></div>
                  </div>

                  <div className="flex-1 hidden sm:block"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}