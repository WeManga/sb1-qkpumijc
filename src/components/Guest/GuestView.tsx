import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle2, Plus, Sparkles, Clock } from 'lucide-react'; 
import confetti from 'canvas-confetti';
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
  const [hasExploded, setHasExploded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Pour le fil d'or et l'explosion
  const programAreaRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: programAreaRef,
    offset: ["start 0.7", "end 0.2"]
  });
  const pathLength = useSpring(scrollYProgress, { stiffness: 40, damping: 25 });

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

  // Déclencheur de l'explosion de paillettes
  useEffect(() => {
    return pathLength.onChange((latest) => {
      if (latest > 0.99 && !hasExploded) {
        setHasExploded(true);
        const end = Date.now() + 2000;
        const colors = ['#D4AF37', '#FCD34D', '#FFD700'];

        (function frame() {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0.1, y: 0.8 }, colors });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 0.9, y: 0.8 }, colors });
          if (Date.now() < end) requestAnimationFrame(frame);
        }());
      }
    });
  }, [pathLength, hasExploded]);

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
      const { error } = await supabase.from('responses').insert([{
          invitation_id: invitation.id,
          group_leader_name: `${guests[0].firstName} ${guests[0].lastName}`,
          guest_details: guests.map(g => ({ firstName: g.firstName, lastName: g.lastName })),
          total_guests: guestCount
      }]);
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

  // Calcul du tracé du fil d'or
  const goldPath = useMemo(() => {
    const steps = invitation.event_program || [];
    if (steps.length === 0) return "";
    let d = "M 50,0";
    steps.forEach((_, i) => {
      const y = i * 200 + 100;
      const prevY = i === 0 ? 0 : (i - 1) * 200 + 100;
      const cp1x = i % 2 === 0 ? 85 : 15;
      const cp2x = i % 2 === 0 ? 15 : 85;
      d += ` C ${cp1x},${prevY + 70} ${cp2x},${y - 70} 50,${y}`;
      d += ` m 0,0 c 8,-8 8,8 0,0 c -8,-8 -8,8 0,0`; // La boucle (noeud)
    });
    const lastY = (steps.length - 1) * 200 + 100;
    d += ` C 50,${lastY + 100} 50,${lastY + 150} 50,${lastY + 250}`;
    return d;
  }, [invitation.event_program]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden touch-none" style={{ backgroundColor: invitation.envelope_color || '#F3F4F6' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .gold-shimmer {
          background: linear-gradient(90deg, #b8860b 0%, #fcd34d 50%, #b8860b 100%);
          background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 4s infinite linear; font-weight: 900;
        }
      `}</style>

      {/* ENVELOPPE / DISQUE */}
      <div className="relative w-full h-full flex items-center justify-center" style={{ opacity: view === 'envelope' ? 1 : 0, pointerEvents: view === 'envelope' ? 'auto' : 'none' }}>
        <div className="relative w-full max-w-[400px] h-full grid place-items-center">
            <motion.div animate={isOpened ? { y: -120, opacity: 1, scale: 1 } : { y: 20, opacity: 0, scale: 0.8 }} transition={{ type: "spring", damping: 25, stiffness: 40, delay: 0.4 }} className="row-start-1 col-start-1 w-[300px] h-[300px] z-20">
              <div className="w-full h-full rounded-full shadow-2xl bg-[#111] relative border-4 border-[#222]">
                <div className="absolute inset-0 opacity-40 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 bg-white rounded-full border-[8px] border-[#111] overflow-hidden shadow-inner">
                    {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div animate={isOpened ? { y: 120, opacity: 1, scale: 1 } : { y: 100, opacity: 0 }} transition={{ type: "spring", damping: 18, stiffness: 50, delay: 0.7 }} onClick={() => setView('content')} className={`row-start-1 col-start-1 z-30 w-[340px] h-[400px] rounded-[3.5rem] shadow-2xl p-10 flex flex-col items-center justify-between cursor-pointer border border-white/40 ${getPaperClass()} hover:scale-105 transition-all duration-700 ease-out`}>
              <div className="text-center pt-10">
                <h2 className="text-3xl font-black uppercase text-gray-900" style={{ fontFamily: invitation.font_style }}>{invitation.title || tBuilder.title_placeholder}</h2>
                <div className="w-16 h-1 bg-amber-400 mx-auto mt-6 rounded-full" />
                <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[10px] font-black uppercase tracking-[0.5em] mt-10">{t.tap_open}</motion.p>
              </div>
              <div className="w-full py-5 bg-gray-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] text-center shadow-xl">
                 {lang === 'vi' ? 'Xem chi tiết' : lang === 'en' ? 'See details' : 'Voir les détails'}
              </div>
            </motion.div>

            <motion.div animate={isOpened ? { y: '-100%', opacity: 0, pointerEvents: 'none' } : { y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }} className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: invitation.envelope_color }}>
              <button onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} className="w-96 h-96 flex items-center justify-center">
                <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" />
              </button>
              <div className="mt-12 flex flex-col items-center gap-4">
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-12 bg-white/20 rounded-full" />
                  <p className="text-white font-black text-xs uppercase tracking-[0.5em] opacity-80">{lang === 'vi' ? 'MỞ' : lang === 'en' ? 'OPEN' : 'OUVRIR'}</p>
              </div>
            </motion.div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <AnimatePresence>
        {view === 'content' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto w-full ${getPaperClass()}`}>
            <div className="relative h-[40vh] shrink-0 overflow-hidden w-full">
              <motion.img initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 10 }} src={invitation.main_photo_url} className="w-full h-full object-cover shadow-2xl" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-8 left-8 w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-2xl text-gray-800"><X size={24}/></button>
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
                      <button onClick={addToCalendar} className="ml-3 p-2 bg-gray-100 rounded-full hover:bg-amber-100"><Plus size={18} className="text-amber-600" /></button>
                    </div>
                </div>
              </div>

              {/* PROGRAMME AVEC FIL D'OR */}
              <div ref={programAreaRef} className="relative py-10">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path d={goldPath} fill="none" stroke="#D4AF37" strokeWidth="1.2" style={{ pathLength }} strokeLinecap="round" className="drop-shadow-[0_0_5px_rgba(212,175,55,0.4)]" />
                </svg>

                <div className="relative space-y-48 w-full pt-12">
                  {(invitation.event_program || []).map((step: any, i: number) => {
                    const isEven = i % 2 === 0;
                    return (
                      <div key={i} className={`flex items-start w-full relative ${isEven ? 'justify-start' : 'justify-end'}`}>
                        <div className="absolute left-1/2 -translate-x-1/2 top-12 z-20 w-5 h-5 bg-amber-500 rounded-full border-[3px] border-white shadow-xl">
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute inset-0 bg-amber-200 rounded-full" />
                        </div>
                        <motion.div initial={{ opacity: 0, x: isEven ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} className={`w-[44%] p-8 bg-white/70 rounded-[3rem] border border-amber-100 backdrop-blur-md shadow-xl ${isEven ? 'text-left pl-10' : 'text-right pr-10'}`}>
                          <span className="text-[11px] font-black text-amber-600 block mb-2 tracking-widest"><Clock size={12} className="inline mr-1 mb-1"/> {step.time}</span>
                          <span className="text-xl font-bold break-words" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-40 relative">
                   <button onClick={openMaps} className="inline-flex flex-col items-center gap-4 group">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl text-amber-500 border border-amber-100"><MapPin size={36}/></div>
                      <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60 underline underline-offset-[12px] decoration-amber-500/40">{invitation.event_address || tBuilder.address_placeholder}</span>
                   </button>
                </div>
              </div>

              {/* RSVP */}
              <div className="bg-white/90 backdrop-blur-2xl rounded-[5rem] p-12 shadow-2xl border border-white relative overflow-hidden">
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-10">
                    <h3 className="font-black uppercase tracking-[0.3em] text-sm text-center">{t.confirm_rsvp}</h3>
                    <div className="flex items-center gap-8 bg-gray-50/50 p-3 rounded-[2rem] border border-gray-100">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-14 h-14 bg-white rounded-2xl shadow-md font-black text-xl">-</button>
                      <div className="flex-1 text-center font-black text-3xl">{guestCount}</div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-14 h-14 bg-white rounded-2xl shadow-md font-black text-xl">+</button>
                    </div>
                    <div className="space-y-5">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                          <input required placeholder={t.first_name} className="bg-white/50 border-none h-16 px-6 rounded-2xl text-sm shadow-inner outline-none focus:ring-2 ring-amber-200" value={guest.firstName} onChange={e => {
                            const ng = [...guests]; ng[i].firstName = e.target.value; setGuests(ng);
                          }} />
                          <input required placeholder={t.last_name} className="bg-white/50 border-none h-16 px-6 rounded-2xl text-sm shadow-inner outline-none focus:ring-2 ring-amber-200" value={guest.lastName} onChange={e => {
                            const ng = [...guests]; ng[i].lastName = e.target.value; setGuests(ng);
                          }} />
                        </div>
                      ))}
                    </div>
                    <button disabled={isSubmitting} className="w-full h-20 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">
                      {isSubmitting ? "..." : t.send}
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