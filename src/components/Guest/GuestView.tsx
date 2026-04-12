import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Send, CheckCircle2, Plus, Sparkles, Clock } from 'lucide-react';
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

  const addToCalendar = () => {
    const startDate = new Date(invitation.event_date).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(invitation.title)}&dates=${startDate}/${startDate}&location=${encodeURIComponent(invitation.event_address)}`;
    
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${invitation.title}\nDTSTART:${startDate}\nLOCATION:${invitation.event_address}\nEND:VEVENT\nEND:VCALENDAR`;
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'event.ics');
      link.click();
    } else {
      window.open(googleUrl, '_blank');
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
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .gold-shimmer {
          background: linear-gradient(90deg, #b8860b 0%, #fcd34d 50%, #b8860b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s infinite linear;
          font-weight: 900;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex flex-col items-center justify-center">
            
            <div className="relative w-[320px] h-[450px] flex items-center justify-center">
                {/* DISQUE (S'ÉLÈVE APRÈS LE SLIDE DE L'ENVELOPPE) */}
                <motion.div 
                  initial={{ y: 0, opacity: 0 }} 
                  animate={isOpened ? { y: -150, opacity: 1 } : { y: 0, opacity: 0 }} 
                  transition={{ type: "spring", damping: 25, stiffness: 60, delay: 0.6 }}
                  className="absolute w-[280px] h-[280px] z-20"
                >
                  <div className={`w-full h-full rounded-full shadow-2xl ${isOpened ? 'animate-disk-spin' : ''}`} style={{ background: '#111' }}>
                    <div className="absolute inset-0 opacity-40 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-white rounded-full border-[6px] border-[#111] overflow-hidden">
                        {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" />}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* CARTE D'APPEL */}
                <motion.div 
                  initial={{ y: 60, opacity: 0, scale: 0.9 }} 
                  animate={isOpened ? { y: 90, opacity: 1, scale: 1 } : { y: 60, opacity: 0 }} 
                  transition={{ type: "spring", damping: 20, delay: 0.9 }}
                  onClick={() => setView('content')}
                  className={`absolute z-30 w-full h-[380px] rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-between cursor-pointer border border-white/30 ${getPaperClass()}`}
                >
                  <div className="text-center pt-10">
                    <h2 className="text-2xl font-black uppercase gold-shimmer" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                    <div className="w-12 h-1 bg-amber-400 mx-auto mt-4 rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-6 animate-pulse">Cliquer pour ouvrir</p>
                  </div>
                  <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg">Voir le programme</div>
                </motion.div>

                {/* ENVELOPPE - EFFET DÉVERROUILLAGE IPHONE (LEVÉE VERS LE HAUT) */}
                <AnimatePresence>
                {!isOpened && (
                  <motion.div 
                    initial={{ y: 0 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                    style={{ backgroundColor: invitation.envelope_color }}
                  >
                    <button 
                      onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} 
                      className="w-64 h-64 hover:scale-105 transition-transform active:scale-95"
                    >
                      <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" />
                    </button>
                    <div className="mt-8 flex flex-col items-center gap-2">
                       <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1 h-8 bg-white/30 rounded-full" />
                       <p className="text-white font-black text-[10px] uppercase tracking-[0.6em]">Glisser pour ouvrir</p>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* VUE CONTENU FINAL (DÉTAILS) */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="relative h-[35vh] shrink-0">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover shadow-lg" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl text-gray-800"><X /></button>
            </div>

            <div className="flex-1 px-6 py-12 max-w-lg mx-auto w-full space-y-20">
              <div className="text-center space-y-6">
                <h2 className="text-sm font-black uppercase tracking-[0.4em] gold-shimmer">{invitation.title}</h2>
                <h1 className="text-5xl font-black gold-shimmer leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                
                <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="flex items-center gap-4 bg-white/60 p-1 pr-5 rounded-full shadow-sm border border-amber-50">
                      <div className="bg-amber-500 p-2.5 rounded-full text-white shadow-md"><Calendar size={20}/></div>
                      <span className="text-xs font-black uppercase tracking-widest">
                        {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}
                      </span>
                      <button onClick={addToCalendar} className="ml-2 p-1.5 bg-gray-100 rounded-full hover:bg-amber-100 transition-colors">
                        <Plus size={16} className="text-amber-600" />
                      </button>
                    </div>
                </div>
              </div>

              <div className="space-y-12">
                <h3 className="text-center font-black uppercase tracking-[0.5em] text-amber-600 text-[10px] flex items-center justify-center gap-3">
                   <Sparkles size={14}/> Programme <Sparkles size={14}/>
                </h3>
                <div className="relative flex flex-col items-center">
                  <motion.div initial={{ height: 0 }} whileInView={{ height: '100%' }} transition={{ duration: 4, ease: "easeInOut" }} className="absolute top-0 w-[4px] bg-gradient-to-b from-amber-200 via-amber-500 to-amber-200 rounded-full" />
                  <div className="relative space-y-20 w-full pt-10">
                    {invitation.event_program?.map((step: any, i: number) => (
                      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.5, delay: i * 0.4 }} key={i} className={`flex items-center w-full ${i % 2 === 0 ? 'justify-start pl-8' : 'justify-end pr-8'}`}>
                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-amber-500 z-10 shadow-lg" />
                        <div className={`w-[42%] p-6 bg-white/60 rounded-[2.5rem] border border-amber-100 backdrop-blur-md shadow-xl ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                          <span className="text-[10px] font-black text-amber-600 block mb-1"><Clock size={10} className="inline mr-1"/> {step.time}</span>
                          <span className="text-lg font-bold uppercase tracking-tighter" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                 <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event_address)}`, '_blank')} className="inline-flex flex-col items-center gap-3 group">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl text-amber-500 group-hover:scale-110 transition-transform border border-amber-100"><MapPin size={28}/></div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60 underline underline-offset-8 decoration-amber-500/30">{invitation.event_address}</span>
                 </button>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[4rem] p-10 shadow-2xl border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400" />
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-8">
                    <div className="text-center space-y-2"><h3 className="font-black uppercase tracking-[0.2em] text-sm">Confirmation de présence</h3></div>
                    <div className="flex items-center gap-6 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl hover:bg-amber-50 transition-colors">-</button>
                      <div className="flex-1 text-center font-black text-2xl">{guestCount}</div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl hover:bg-amber-50 transition-colors">+</button>
                    </div>
                    <div className="space-y-4">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-4">
                          <input required placeholder="Prénom" className="bg-white border-none h-14 px-5 rounded-2xl text-sm shadow-sm focus:ring-2 ring-amber-200 outline-none" value={guest.firstName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].firstName = e.target.value;
                            setGuests(newGuests);
                          }} />
                          <input required placeholder="Nom" className="bg-white border-none h-14 px-5 rounded-2xl text-sm shadow-sm focus:ring-2 ring-amber-200 outline-none" value={guest.lastName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].lastName = e.target.value;
                            setGuests(newGuests);
                          }} />
                        </div>
                      ))}
                    </div>
                    <button disabled={isSubmitting} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                      {isSubmitting ? "Envoi..." : <><Send size={18} className="text-amber-400"/> Je confirme</>}
                    </button>
                  </form>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} className="text-green-500" />
                    </div>
                    <h3 className="font-black uppercase tracking-widest text-green-600">C'est validé !</h3>
                    <p className="text-xs font-bold opacity-50 uppercase">Nous avons bien reçu votre réponse.</p>
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