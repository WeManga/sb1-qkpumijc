import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Send, CheckCircle2, Plus, Sparkles, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n'; // MISE À JOUR : Import des traductions

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

  // MISE À JOUR : Sélection de la langue
  const lang = (invitation.language as Language) || 'fr';
  const t = translations[lang].guest;

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
      const { error } = await supabase.from('responses').insert([
        {
          invitation_id: invitation.id,
          group_leader_name: `${guests[0].firstName} ${guests[0].lastName}`,
          guest_details: guests.map(g => ({
            firstName: g.firstName,
            lastName: g.lastName
          })),
          total_guests: guestCount
        }
      ]);
      
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Erreur RSVP:", err);
      alert("Erreur : " + (err.message || "Inconnue"));
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden touch-none" style={{ backgroundColor: invitation.envelope_color || '#F3F4F6' }}>
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

      <div className="relative w-full h-full flex items-center justify-center" style={{ opacity: view === 'envelope' ? 1 : 0, pointerEvents: view === 'envelope' ? 'auto' : 'none' }}>
        <div className="relative w-full max-w-[400px] h-full grid place-items-center">
            <motion.div 
              initial={false}
              animate={isOpened ? { y: -120, opacity: 1, scale: 1 } : { y: 20, opacity: 0, scale: 0.8 }} 
              transition={{ type: "spring", damping: 25, stiffness: 40, delay: 0.4 }}
              className="row-start-1 col-start-1 w-[300px] h-[300px] z-20"
            >
              <div className={`w-full h-full rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.5)] ${isOpened ? 'animate-disk-spin' : ''}`} style={{ background: '#111' }}>
                <div className="absolute inset-0 opacity-40 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 bg-white rounded-full border-[8px] border-[#111] overflow-hidden shadow-inner">
                    {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" />}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={false}
              animate={isOpened ? { y: 120, opacity: 1, scale: 1, rotateX: 0 } : { y: 100, opacity: 0, scale: 0.9, rotateX: 20 }} 
              transition={{ type: "spring", damping: 18, stiffness: 50, delay: 0.7 }}
              onClick={() => setView('content')}
              className={`row-start-1 col-start-1 z-30 w-[340px] h-[400px] rounded-[3.5rem] shadow-2xl p-10 flex flex-col items-center justify-between cursor-pointer border border-white/40 ${getPaperClass()} hover:scale-105 transition-all duration-700 ease-out`}
            >
              <div className="text-center pt-10">
                <h2 className="text-3xl font-black uppercase text-gray-900" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                <div className="w-16 h-1 bg-amber-400 mx-auto mt-6 rounded-full" />
                <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[10px] font-black uppercase tracking-[0.5em] mt-10">
                  {t.tap_open}
                </motion.p>
              </div>
              <div className="w-full py-5 bg-gray-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] text-center shadow-xl">
                 {lang === 'vi' ? 'Khám phá sự kiện' : 'Explorer l\'événement'}
              </div>
            </motion.div>

            <motion.div 
              animate={isOpened ? { y: '-100%', opacity: 0, pointerEvents: 'none' } : { y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center"
              style={{ backgroundColor: invitation.envelope_color }}
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} 
                className="w-96 h-96 flex items-center justify-center"
              >
                <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]" />
              </motion.button>
              <div className="mt-12 flex flex-col items-center gap-4">
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="w-1.5 h-12 bg-white/20 rounded-full" />
                  <p className="text-white font-black text-xs uppercase tracking-[0.8em] opacity-80">
                    {lang === 'vi' ? 'Mở' : lang === 'en' ? 'Open' : 'Ouvrir'}
                  </p>
              </div>
            </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {view === 'content' && (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto overflow-x-hidden touch-pan-y w-full ${getPaperClass()}`}>
            <div className="relative h-[40vh] shrink-0 overflow-hidden w-full">
              <motion.img initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 10 }} src={invitation.main_photo_url} className="w-full h-full object-cover shadow-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-8 left-8 w-14 h-14 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl text-gray-800 hover:scale-110 transition-transform"><X size={24}/></button>
            </div>

            <div className="flex-1 px-8 py-16 max-w-2xl mx-auto w-full space-y-24">
              <div className="text-center space-y-8">
                <h2 className="text-sm font-black uppercase tracking-[0.5em] gold-shimmer">{invitation.title}</h2>
                <h1 className="text-6xl font-black gold-shimmer leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                
                <div className="flex flex-col items-center gap-6 pt-6">
                    <div className="flex items-center gap-5 bg-white/80 p-1.5 pr-6 rounded-full shadow-lg border border-amber-100">
                      <div className="bg-amber-500 p-3 rounded-full text-white shadow-md"><Calendar size={22}/></div>
                      <span className="text-sm font-black uppercase tracking-widest">
                        {new Date(invitation.event_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {day:'numeric', month:'long', year:'numeric'})}
                      </span>
                      <button onClick={addToCalendar} className="ml-3 p-2 bg-gray-100 rounded-full hover:bg-amber-100 transition-colors">
                        <Plus size={18} className="text-amber-600" />
                      </button>
                    </div>
                </div>
              </div>

              {invitation.description && (
                <div className="text-center max-w-lg mx-auto">
                  <p className="text-lg leading-relaxed opacity-80 whitespace-pre-wrap italic" style={{ fontFamily: invitation.font_style }}>
                    {invitation.description}
                  </p>
                  <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-10" />
                </div>
              )}

              <div className="space-y-16">
                <h3 className="text-center font-black uppercase tracking-[0.6em] text-amber-600 text-[10px] flex items-center justify-center gap-4">
                   <Sparkles size={16}/> {lang === 'vi' ? 'Chương trình' : lang === 'en' ? 'Program' : 'Le Programme'} <Sparkles size={16}/>
                </h3>
                <div className="relative flex flex-col items-center">
                  <div className="absolute top-0 w-[4px] h-full bg-gradient-to-b from-amber-200 via-amber-500 to-amber-200 rounded-full" />
                  <div className="relative space-y-24 w-full pt-12">
                    {invitation.event_program?.map((step: any, i: number) => (
                      <div key={i} className={`flex items-center w-full ${i % 2 === 0 ? 'justify-start pl-10' : 'justify-end pr-10'}`}>
                        <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-[6px] border-amber-500 z-10 shadow-2xl" />
                        <div className={`w-[44%] p-8 bg-white/70 rounded-[3rem] border border-amber-100 backdrop-blur-md shadow-2xl ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                          <span className="text-[11px] font-black text-amber-600 block mb-2 tracking-widest"><Clock size={12} className="inline mr-1 mb-1"/> {step.time}</span>
                          <span className="text-xl font-bold uppercase tracking-tighter" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center pt-8">
                 <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event_address)}`, '_blank')} className="inline-flex flex-col items-center gap-4 group">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl text-amber-500 border border-amber-100"><MapPin size={32}/></div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60 underline underline-offset-[12px] decoration-amber-500/40">{invitation.event_address}</span>
                 </button>
              </div>

              <div className="bg-white/90 backdrop-blur-2xl rounded-[5rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-10">
                    <div className="text-center space-y-3"><h3 className="font-black uppercase tracking-[0.3em] text-sm">{t.confirm_rsvp}</h3></div>
                    <div className="flex items-center gap-8 bg-gray-50/50 p-3 rounded-[2rem] border border-gray-100">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-14 h-14 bg-white rounded-2xl shadow-md font-black text-xl hover:bg-amber-50 transition-colors">-</button>
                      <div className="flex-1 text-center font-black text-3xl">{guestCount}</div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-14 h-14 bg-white rounded-2xl shadow-md font-black text-xl hover:bg-amber-50 transition-colors">+</button>
                    </div>
                    <div className="space-y-5">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                          <input required placeholder={t.first_name} className="bg-white/50 border-none h-16 px-6 rounded-2xl text-sm shadow-inner focus:ring-2 ring-amber-200 outline-none transition-all" value={guest.firstName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].firstName = e.target.value;
                            setGuests(newGuests);
                          }} />
                          <input required placeholder={t.last_name} className="bg-white/50 border-none h-16 px-6 rounded-2xl text-sm shadow-inner focus:ring-2 ring-amber-200 outline-none transition-all" value={guest.lastName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].lastName = e.target.value;
                            setGuests(newGuests);
                          }} />
                        </div>
                      ))}
                    </div>
                    <button disabled={isSubmitting} className="w-full h-20 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-black">
                      {isSubmitting ? "..." : <><Send size={20} className="text-amber-400"/> {t.send}</>}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-16 space-y-6">
                    <CheckCircle2 size={64} className="text-green-500 mx-auto" />
                    <h3 className="font-black uppercase tracking-widest text-green-600 text-xl">{t.thank_you}</h3>
                    <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{t.success_msg}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}