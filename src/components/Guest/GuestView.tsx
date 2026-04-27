import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle2, Plus, Clock, Sparkles } from 'lucide-react'; 
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
      case 'silk': return 'paper-silk';
      case 'velvet': return 'paper-velvet';
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
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden touch-none" style={{ backgroundColor: invitation.envelope_color || '#F3F4F6', fontFamily: invitation.font_style }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .gold-shimmer {
          background: linear-gradient(90deg, #b8860b 0%, #fcd34d 50%, #b8860b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s infinite linear;
          font-weight: 900;
        }
        .animate-disk-spin { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
                <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tighter" style={{ fontFamily: invitation.font_style }}>{invitation.title || tBuilder.title_placeholder}</h2>
                <div className="w-16 h-1.5 bg-amber-400 mx-auto mt-6 rounded-full" />
                <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[10px] font-black uppercase tracking-[0.5em] mt-10 text-gray-500">
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
                className="w-80 h-80 flex items-center justify-center relative"
              >
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative z-10" />
              </motion.button>
              <div className="mt-12 flex flex-col items-center gap-4">
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="w-1.5 h-12 bg-white/30 rounded-full" />
                  <p className="text-white font-black text-xs uppercase tracking-[0.6em] opacity-90">
                    {lang === 'vi' ? 'MỞ' : lang === 'en' ? 'OPEN' : 'OUVRIR'}
                  </p>
              </div>
            </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {view === 'content' && (
          <motion.div key="content" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ duration: 0.6, ease: "easeOut" }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto overflow-x-hidden touch-pan-y w-full ${getPaperClass()}`}>
            <div className="relative h-[50vh] shrink-0 overflow-hidden w-full">
              <motion.img initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} src={invitation.main_photo_url} className="w-full h-full object-cover shadow-2xl" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-8 left-8 w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl text-gray-800 border border-gray-100"><X size={20}/></button>
            </div>

            <div className="flex-1 px-6 pb-24 -mt-20 relative z-10 max-w-2xl mx-auto w-full space-y-20">
              <div className="text-center space-y-8 bg-white/40 backdrop-blur-md p-10 rounded-[4rem] border border-white/60 shadow-xl">
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-500">{invitation.title}</h2>
                <h1 className="text-5xl md:text-7xl font-black gold-shimmer leading-tight py-2" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                
                <div className="flex flex-col items-center gap-6 pt-4">
                    <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-md border border-amber-50">
                      <div className="bg-amber-500 p-3 rounded-full text-white shadow-lg shadow-amber-200"><Calendar size={20}/></div>
                      <span className="text-xs font-black uppercase tracking-widest text-gray-700">
                        {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {day:'numeric', month:'long', year:'numeric'}) : t.save_date}
                      </span>
                      <button onClick={addToCalendar} className="ml-2 p-2 bg-gray-50 rounded-full hover:bg-amber-50 transition-colors">
                        <Plus size={16} className="text-amber-600" />
                      </button>
                    </div>
                </div>
              </div>

              {invitation.description && (
                <div className="text-center max-w-lg mx-auto px-4">
                  <p className="text-xl leading-relaxed text-gray-700 font-medium italic opacity-90" style={{ fontFamily: invitation.font_style }}>
                    "{invitation.description}"
                  </p>
                  <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto mt-12" />
                </div>
              )}

              <div className="space-y-12">
                <h3 className="text-center font-black uppercase tracking-[0.6em] text-amber-600 text-[10px] opacity-80 flex items-center justify-center gap-2">
                   —— <Sparkles size={12}/> {tBuilder.program_title} <Sparkles size={12}/> ——
                </h3>
                <div className="relative flex flex-col items-center">
                  <div className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-amber-200 to-transparent" />
                  
                  <div className="relative space-y-16 w-full">
                    {(invitation.event_program || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: isEven ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} className={`flex items-center w-full relative ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className="w-[45%]">
                            <div className={`overflow-hidden bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-amber-50 shadow-lg ${isEven ? 'text-right' : 'text-left'}`}>
                              {step.image_url && (
                                <div className="w-full aspect-video overflow-hidden border-b border-amber-50">
                                  <img src={step.image_url} className="w-full h-full object-cover" alt="" />
                                </div>
                              )}
                              <div className="p-6">
                                <span className="text-[10px] font-black text-amber-600 block mb-1 tracking-tighter opacity-80"><Clock size={12} className="inline mr-1 mb-0.5"/> {step.time}</span>
                                <span className="text-lg font-bold text-gray-800 leading-tight" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-[10%] flex justify-center relative z-20">
                            <div className="w-3 h-3 bg-amber-400 rounded-full ring-4 ring-white shadow-sm" />
                          </div>
                          <div className="w-[45%]" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {invitation.plan_type === 'PREMIUM' && invitation.end_photo_url && (
                <div className="px-2">
                  <div className="rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white rotate-1">
                    <img src={invitation.end_photo_url} className="w-full h-auto" alt="End" />
                  </div>
                </div>
              )}

              <div className="text-center pt-8">
                 <motion.button whileInView={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} onClick={openMaps} className="inline-flex flex-col items-center gap-4 group">
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl text-amber-500 border border-amber-50 group-hover:bg-amber-50 transition-colors"><MapPin size={32}/></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 max-w-[200px] leading-relaxed">
                      {invitation.event_address}
                    </span>
                 </motion.button>
              </div>

              <div className="bg-gray-900 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500 opacity-50" />
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-8">
                    <div className="text-center"><h3 className="font-black uppercase tracking-[0.4em] text-xs text-white/90">{t.confirm_rsvp}</h3></div>
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-[2rem] border border-white/10">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-14 h-14 bg-white/10 text-white rounded-2xl font-black text-xl">-</button>
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black text-3xl">{guestCount}</span>
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{guestCount > 1 ? 'Invités' : 'Invité'}</span>
                      </div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-14 h-14 bg-white/10 text-white rounded-2xl font-black text-xl">+</button>
                    </div>
                    <div className="space-y-4">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-3">
                          <input required placeholder={t.first_name} className="bg-white/10 border-white/10 h-14 px-5 rounded-2xl text-sm text-white placeholder:text-white/30 focus:ring-1 ring-amber-400 outline-none transition-all" value={guest.firstName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].firstName = e.target.value;
                            setGuests(newGuests);
                          }} />
                          <input required placeholder={t.last_name} className="bg-white/10 border-white/10 h-14 px-5 rounded-2xl text-sm text-white placeholder:text-white/30 focus:ring-1 ring-amber-400 outline-none transition-all" value={guest.lastName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].lastName = e.target.value;
                            setGuests(newGuests);
                          }} />
                        </div>
                      ))}
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full h-16 bg-white text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" /> : t.confirm_btn}
                    </button>
                  </form>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">
                      <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white font-black text-2xl uppercase tracking-tighter">{t.thank_you}</h3>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{t.confirmation_sent}</p>
                    </div>
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