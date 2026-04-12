import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Volume2, VolumeX, MapPin, Clock, Send, CheckCircle2, Sparkles, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const THEME_EMOJIS: Record<string, string[]> = {
  wedding: ['🤍', '💍', '🕊️', '✨', '🌸'],
  birthday: ['🎂', '🎈', '✨', '🎉', '🍰'],
  party: ['✨', '🎸', '🥂', '🕺', '🌟'],
  baptism: ['👼', '☁️', '🤍', '✨', '🕊️'],
  babyshower: ['🍼', '🤍', '👶', '💖', '💙'],
  funeral: ['🙏', '🕊️', '🥀', '⚰️', '🤍'],
  default: ['✨', '🌟', '🤍']
};

export function GuestView({ invitation }: any) {
  const [isOpened, setIsOpened] = useState(false);
  const [view, setView] = useState<'envelope' | 'content'>('envelope');
  const [isMuted, setIsMuted] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [guests, setGuests] = useState([{ firstName: '', lastName: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const emojis = THEME_EMOJIS[invitation?.event_type] || THEME_EMOJIS.default;

  const getPaperClass = () => {
    switch(invitation.paper_type) {
      case 'parchment': return 'paper-parchment';
      case 'grainy': return 'paper-grainy';
      case 'cotton': return 'paper-cotton';
      default: return 'paper-smooth';
    }
  };

  useEffect(() => {
    const newGuests = Array.from({ length: guestCount }, (_, i) => 
      guests[i] || { firstName: '', lastName: '' }
    );
    setGuests(newGuests);
  }, [guestCount]);

  // Fonction universelle iOS / Android / Desktop pour le calendrier
  const addToCalendar = () => {
    const title = invitation.title || "Événement";
    const details = "Invitation Digitale";
    const location = invitation.event_address || "";
    const startDate = new Date(invitation.event_date).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(new Date(invitation.event_date).getTime() + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // +2h
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${startDate}\nDTEND:${endDate}\nLOCATION:${location}\nDESCRIPTION:${details}\nEND:VEVENT\nEND:VCALENDAR`;
    const icsFile = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const icsUrl = URL.createObjectURL(icsFile);

    // Si Android/Chrome -> Google Calendar, sinon (iOS/Safari) -> Fichier ICS
    if (/Android/i.test(navigator.userAgent)) {
      window.open(googleUrl, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = icsUrl;
      link.setAttribute('download', 'event.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('responses').insert(
        guests.map(g => ({
          invitation_id: invitation.id,
          first_name: g.firstName,
          last_name: g.lastName,
          status: 'confirmed'
        }))
      );
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) {
      alert("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const EmojiRain = () => {
    const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${(i * 4) + (Math.random() * 3)}%`,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 2
    })), [emojis]);

    return (
      <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span key={p.id} initial={{ y: -50, opacity: 0 }} animate={{ y: 1000, opacity: [0, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
            className="absolute text-3xl" style={{ left: p.left }}>{p.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: invitation.envelope_color || '#F3F4F6' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex flex-col items-center justify-center">
            
            <div className="relative w-[320px] h-[450px] flex items-center justify-center">
                {/* DISQUE VINYLE */}
                <motion.div 
                  initial={{ y: 0 }} 
                  animate={isOpened ? { y: -140 } : { y: 0 }} 
                  transition={{ type: "spring", damping: 25, stiffness: 80 }}
                  className="absolute w-[280px] h-[280px] z-20"
                >
                <div className={`w-full h-full relative rounded-full shadow-2xl ${isOpened ? 'animate-disk-spin' : ''}`}>
                    <div className="absolute inset-0 rounded-full bg-[#111]">
                      <div className="absolute inset-0 opacity-40 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-white rounded-full border-[6px] border-[#111] overflow-hidden shadow-inner">
                          {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
                      </div>
                    </div>
                </div>
                </motion.div>

                {/* CARTE D'APPEL */}
                <motion.div 
                  initial={{ y: 0, scale: 0.8, opacity: 0 }} 
                  animate={isOpened ? { y: 80, scale: 1, opacity: 1 } : { y: 0, opacity: 0 }} 
                  transition={{ type: "spring", damping: 20, delay: 0.5 }}
                  onClick={() => isOpened && setView('content')}
                  className={`absolute z-30 w-full h-[380px] rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-between cursor-pointer border border-white/20 ${getPaperClass()}`}
                >
                  <div className="text-center pt-10">
                      <h2 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                      <div className="w-10 h-1 bg-amber-400 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Découvrir le programme</p>
                  </div>
                  <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">Voir les détails</div>
                </motion.div>
            </div>

            {/* ENVELOPPE QUI GLISSE VERS LE HAUT */}
            {!isOpened && (
              <motion.div 
                initial={{ y: 0 }}
                exit={{ y: '-120%', opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.45, 0, 0.55, 1] }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center" 
                style={{ backgroundColor: invitation.envelope_color }}
              >
                <button 
                  onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} 
                  className="w-72 h-72 hover:scale-105 transition-transform active:scale-95"
                >
                  <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" />
                </button>
                <p className="text-white font-black text-xs uppercase tracking-[0.5em] mt-6 animate-pulse">Ouvrir l'invitation</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* VUE DÉTAILLÉE (PARTIE FINALE) */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="relative h-[35vh] shrink-0">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl text-gray-800"><X /></button>
            </div>

            <div className="flex-1 px-6 py-12 max-w-lg mx-auto w-full space-y-16">
              {/* TITRE ET NOM AVEC EFFET TEXTE GRADIENT ANIMÉ */}
              <div className="text-center space-y-4">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 bg-clip-text text-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }}>
                  {invitation.title}
                </h2>
                <h1 className="text-5xl font-black leading-none pb-2 bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent" style={{ fontFamily: invitation.font_style }}>
                  {invitation.host_names}
                </h1>
                
                <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="flex items-center gap-4 bg-white/60 p-1 pr-4 rounded-full shadow-sm border border-white">
                      <div className="bg-amber-500 p-2 rounded-full text-white"><Calendar size={18}/></div>
                      <span className="text-xs font-black uppercase tracking-widest">
                        {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}
                      </span>
                      <button onClick={addToCalendar} className="ml-2 p-1.5 bg-gray-100 rounded-full hover:bg-amber-100 transition-colors">
                        <Plus size={14} className="text-amber-600" />
                      </button>
                    </div>
                </div>
              </div>

              {/* PROGRAMME TIMELINE */}
              <div className="space-y-12">
                <h3 className="text-center font-black uppercase tracking-[0.4em] text-amber-600 text-[10px]">Déroulement</h3>
                <div className="relative flex flex-col items-center">
                  <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ duration: 4 }} className="absolute top-0 w-[4px] bg-gradient-to-b from-amber-200 via-amber-500 to-amber-200 rounded-full" />
                  
                  <div className="relative space-y-16 w-full pt-8">
                    {invitation.event_program?.map((step: any, i: number) => (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.3 }} key={i} className={`flex items-center w-full ${i % 2 === 0 ? 'justify-start pl-8' : 'justify-end pr-8'}`}>
                        <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-4 border-amber-500 z-10 shadow-md" />
                        <div className={`w-[42%] p-5 bg-white/60 rounded-[2rem] border border-amber-100 backdrop-blur-md shadow-lg ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                          <span className="text-[10px] font-black text-amber-600 block mb-1">{step.time}</span>
                          <span className="text-lg font-bold uppercase tracking-tighter" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ADRESSE PLACÉE ICI */}
              <div className="text-center pt-4">
                 <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event_address)}`, '_blank')}
                  className="inline-flex flex-col items-center gap-2 group"
                 >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-500 group-hover:scale-110 transition-transform">
                      <MapPin size={24}/>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-60 underline underline-offset-4">{invitation.event_address}</span>
                 </button>
              </div>

              {/* RSVP */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[3.5rem] p-10 shadow-2xl border border-white overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-8">
                    <div className="text-center"><h3 className="font-black uppercase tracking-[0.2em] text-sm">Confirmation</h3></div>
                    <div className="flex items-center gap-6 bg-gray-100/50 p-2 rounded-2xl">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl">-</button>
                      <div className="flex-1 text-center font-black text-2xl">{guestCount}</div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl">+</button>
                    </div>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-3">
                          <input required placeholder="Prénom" className="bg-white border-none h-14 px-5 rounded-2xl text-sm shadow-sm focus:ring-2 ring-amber-200 transition-all outline-none" value={guest.firstName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].firstName = e.target.value;
                            setGuests(newGuests);
                          }} />
                          <input required placeholder="Nom" className="bg-white border-none h-14 px-5 rounded-2xl text-sm shadow-sm focus:ring-2 ring-amber-200 transition-all outline-none" value={guest.lastName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].lastName = e.target.value;
                            setGuests(newGuests);
                          }} />
                        </div>
                      ))}
                    </div>
                    <button disabled={isSubmitting} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                      {isSubmitting ? "Envoi..." : <><Send size={18} className="text-amber-400"/> Confirmer</>}
                    </button>
                  </form>
                ) : (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-12 space-y-4">
                    <CheckCircle2 size={56} className="text-green-500 mx-auto" />
                    <h3 className="font-black uppercase tracking-widest text-green-600">C'est validé !</h3>
                    <p className="text-xs font-bold opacity-40 uppercase">Nous avons hâte de vous voir</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}