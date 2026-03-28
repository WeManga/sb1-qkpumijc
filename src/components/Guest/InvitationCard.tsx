import { useState, useEffect } from 'react';
import { Database } from '../../lib/database.types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

interface InvitationCardProps {
  invitation: Invitation;
  onViewFull: () => void;
}

export function InvitationCard({ invitation, onViewFull }: InvitationCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [vinylRotation, setVinylRotation] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => setVinylRotation(r => (r + 2) % 360), 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 bg-black/40 backdrop-blur-sm">
      <div className={`relative w-full max-w-md transition-all duration-1000 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="relative h-64">
            {invitation.main_photo_url && (
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" alt="Event" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-8 text-white">
              <h1 className="text-3xl font-bold mb-1">{invitation.title}</h1>
              <p className="text-sm opacity-80 uppercase tracking-widest">{invitation.host_names}</p>
            </div>
          </div>

          <div className="p-10 pt-20 text-center relative">
             {/* VINYLE TOURNANT */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2">
               <div 
                className="w-32 h-32 rounded-full border-8 border-white bg-[#111] shadow-xl flex items-center justify-center"
                style={{ transform: `rotate(${vinylRotation}deg)` }}
               >
                 <div className="w-10 h-10 bg-amber-400 rounded-full border-2 border-white/20" />
               </div>
            </div>

            <button 
              onClick={onViewFull}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg"
            >
              Découvrir les détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}