import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle2, Plus, Sparkles, Clock } from 'lucide-react'; 
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';

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

  const lang = (invitation.language as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].guest;
  const tBuilder = translations[lang].builder;

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
    const eventDate = new Date(invitation.event_date);
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const startDate = formatDate(eventDate);
    const endDate = formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000));
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(invitation.title)}&dates=${startDate}/${endDate}&location=${encodeURIComponent(invitation.event_address)}&details=${encodeURIComponent(invitation.description || "")}`;
    window.open(googleUrl, '_blank');
  };

  const openMaps = () => {
    const address = encodeURIComponent(invitation.event_address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${address}`, '_blank');
    } else {
      window.open(`geo:0,0?q=${address}`, '_blank');
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
          guest_details: guests.map(g => ({ firstName: g.firstName, lastName: g.lastName })),
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
                    {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
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
                <h2 className="text-3xl font-black uppercase text-gray-900" style={{ fontFamily: invitation.font_style }}>{invitation.title || tBuilder.title_placeholder}</h2>
                <div className="w-16 h-1 bg-amber-400 mx-auto mt-6 rounded-full" />
                <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[10px] font-black uppercase tracking-[0.5em] mt-10">
                  {t.tap_open}
                </motion.p>
              </div>
              <div className="w-full py-5 bg-gray-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] text-center shadow-xl">
                 {lang === 'vi' ? 'Xem chi tiết' : lang === 'en' ? 'See details' : 'Voir les détails'}
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
                  <p className="text-white font-black text-xs uppercase tracking-[0.5em] opacity-80">
                    {lang === 'vi' ? 'MỞ' : lang === 'en' ? 'OPEN' : 'OUVRIR'}
                  </p>
              </div>
            </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {view === 'content' && (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto overflow-x-hidden touch-pan-y w-full ${getPaperClass()}`}>
            <div className="relative h-[40vh] shrink-0 overflow-hidden w-full">
              <motion.img initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 10 }} src={invitation.main_photo_url} className="w-full h-full object-cover shadow-2xl" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-8 left-8 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md"><X size={20}/></button>
            </div>

            <div className="flex-1 px-8 py-16 max-w-2xl mx-auto w-full space-y-24">
              <div className="text-center space-y-8">
                <h2 className="text-sm font-black uppercase tracking-[0.5em] gold-shimmer">{invitation.title || tBuilder.title_placeholder}</h2>
                <h1 className="text-6xl font-black gold-shimmer leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation.host_names || tBuilder.hosts_placeholder}</h1>
                
                <div className="flex flex-col items-center gap-6 pt-6">
                    <div className="flex items-center gap-5 bg-white/80 p-1.5 pr-6 rounded-full shadow-lg border border-amber-100">
                      <div className="bg-amber-500 p-3 rounded-full text-white shadow-md"><Calendar size={22}/></div>
                      <span className="text-sm font-black uppercase tracking-widest">
                        {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {day:'numeric', month:'long', year:'numeric'}) : t.save_date}
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
                  <div className="w-12 h-[1px] bg-amber-200 mx-auto mt-6" />
                </div>
              )}

              <div className="space-y-16">
                <h3 className="text-center font-black uppercase tracking-[0.6em] text-amber-600 text-[10px] flex items-center justify-center gap-4">
                     {tBuilder.program_title} 
                </h3>
                
                <div className="relative flex flex-col items-center">
                  <div className="relative space-y-24 w-full pt-12">
                    {(invitation.event_program || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;
                      return (
                        <div key={i} className={`flex items-start w-full relative ${isEven ? 'justify-start pl-10' : 'justify-end pr-10'}`}>
                          
                          {/* FIL D'OR COURBÉ ENTRE LES ÉTAPES */}
                          {i > 0 && (
                            <div className="absolute top-[-96px] left-1/2 -translate-x-1/2 w-20 h-[100px] pointer-events-none">
                              <svg width="100%" height="100%" viewBox="0 0 40 100" preserveAspectRatio="none">
                                <motion.path
                                  d={i % 2 === 0 ? "M 20 0 C 40 50, 40 50, 20 100" : "M 20 0 C 0 50, 0 50, 20 100"}
                                  fill="none"
                                  stroke="#fbbf24"
                                  strokeWidth="3"
                                  initial={{ pathLength: 0 }}
                                  whileInView={{ pathLength: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                              </svg>
                            </div>
                          )}

                          {/* POINT CIRCULAIRE DORÉ */}
                          <motion.div 
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="absolute top-12 left-1/2 -translate-x-1/2 z-20 w-4 h-4 bg-amber-500 border-2 border-white shadow-lg rounded-full"
                          >
                            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-amber-300 rounded-full" />
                          </motion.div>

                          <motion.div 
                            initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className={`w-[44%] p-8 bg-white/70 rounded-[3rem] border border-amber-100 backdrop-blur-md shadow-2xl ${isEven ? 'text-left' : 'text-right'}`}
                          >
                            <span className="text-[11px] font-black text-amber-600 block mb-2 tracking-widest"><Clock size={12} className="inline mr-1 mb-1"/> {step.time}</span>
                            <span className="text-xl font-bold tracking-tighter break-words" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>

                  {/* FIL D'OR FINAL VERS L'ADRESSE */}
                  <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 w-20 h-[80px] pointer-events-none">
                     <svg width="100%" height="100%" viewBox="0 0 40 80" preserveAspectRatio="none">
                        <motion.path
                          d="M 20 0 C 10 40, 10 40, 20 80"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="3"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                      </svg>
                  </div>
                </div>

                <div className="text-center pt-24 relative">
                   <button onClick={openMaps} className="inline-flex flex-col items-center gap-4 group relative z-20">
                      <motion.div 
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", damping: 12, delay: 1 }}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl text-amber-500 border border-amber-100 group-hover:scale-110 transition-transform"
                      >
                        <MapPin size={32}/>
                      </motion.div>
                      <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60 underline underline-offset-[12px] decoration-amber-500/40">{invitation.event_address || tBuilder.address_placeholder}</span>
                   </button>
                </div>
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
                      {isSubmitting ? "..." : <>{t.send}</>}
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