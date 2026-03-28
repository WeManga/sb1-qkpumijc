import { useState } from 'react';

interface EnvelopeProps {
  envelopeColor: string;
  onOpenEnvelope: () => void;
}

export function EnvelopeAnimation({ envelopeColor, onOpenEnvelope }: EnvelopeProps) {
  const [step, setStep] = useState(0);

  const colors: Record<string, any> = {
    gold: { main: '#d97706', dark: '#b45309', paper: '#fffdfa' },
    red: { main: '#be123c', dark: '#9f1239', paper: '#fffafa' },
    blue: { main: '#1d4ed8', dark: '#1e40af', paper: '#f8faff' },
    pink: { main: '#db2777', dark: '#be185d', paper: '#fffafb' },
    white: { main: '#ffffff', dark: '#f3f4f6', paper: '#ffffff' }
  };
  
  const theme = colors[envelopeColor] || colors.gold;

  const handleInteraction = () => {
    if (step === 0) {
      setStep(1);
    } else {
      setStep(2);
      setTimeout(onOpenEnvelope, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f4f1ee] flex flex-col items-center justify-center z-[9999] p-10">
      <div 
        onClick={handleInteraction}
        className={`relative w-full max-w-[500px] h-[300px] transition-all duration-1000 cursor-pointer ${step === 2 ? 'scale-110 opacity-0' : 'scale-100'}`}
        style={{ perspective: '1500px' }}
      >
        {/* VINYLE */}
        <div 
          className={`absolute left-1/2 w-56 h-56 sm:w-72 sm:h-72 bg-[#111] rounded-full border-[8px] border-[#222] shadow-2xl transition-all duration-[1200ms] ease-out
            ${step >= 1 ? '-translate-y-56 -translate-x-1/2 rotate-[360deg] opacity-100' : '-translate-x-1/2 translate-y-0 opacity-0'}`}
          style={{ zIndex: 10 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-200">
            <div className="w-4 h-4 bg-black rounded-full shadow-inner" />
          </div>
        </div>

        {/* FAIRE-PART */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 w-[94%] h-[95%] rounded-sm shadow-xl transition-all duration-1000 ease-in-out
            ${step >= 1 ? '-translate-y-40 scale-105 opacity-100' : 'translate-y-0 opacity-0'}`}
          style={{ zIndex: 20, backgroundColor: theme.paper }}
        >
          <div className="p-6 h-full border-[10px] border-double border-amber-600/10 m-2 flex flex-col items-center justify-center text-center">
            <h2 className="font-serif text-2xl tracking-[0.2em] text-gray-800">THE WEDDING</h2>
          </div>
        </div>

        {/* CORPS ENVELOPPE */}
        <div className="absolute inset-0 rounded-b-2xl z-30 shadow-2xl" style={{ backgroundColor: theme.main }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-b-2xl" />
        </div>

        {/* RABAT */}
        <div 
          className={`absolute inset-0 z-40 origin-top transition-transform duration-700
            ${step >= 1 ? '-rotate-x-180 opacity-0' : ''}`}
          style={{ 
            backgroundColor: theme.dark,
            clipPath: 'polygon(0% 0%, 50% 65%, 100% 0%)'
          }}
        />

        {/* SCEAU */}
        {step === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="w-20 h-20 bg-[#8b0000] rounded-full border-4 border-[#5a0000] shadow-2xl flex items-center justify-center text-white font-serif font-bold text-xl animate-pulse">
              OPEN
            </div>
          </div>
        )}
      </div>
      <div className="mt-16 text-amber-900/40 font-serif italic tracking-widest">
        {step === 0 ? "Appuyez pour ouvrir" : "Appuyez encore pour voir les détails"}
      </div>
    </div>
  );
}