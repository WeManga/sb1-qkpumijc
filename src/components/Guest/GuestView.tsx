import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle2, Plus, Clock } from 'lucide-react'; 
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

  // EFFET PAILLETTES : Se déclenche quand le fil atteint l'adresse
  useEffect(() => {
    return pathLength.onChange((latest) => {
      if (latest > 0.99 && !hasExploded) {
        setHasExploded(true);
        const end = Date.now() + 2500;
        const colors = ['#D4AF37', '#FCD34D', '#FFD700', '#E6C65D'];

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.85 },
            colors: colors
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.85 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
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
      window.open(`http://maps.google.com/?q=${address}`, '_blank');
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
      alert("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CALCUL DU FIL D'OR AVEC NOEUDS SERRÉS
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
      // Noeud stylisé au centre du point
      d += ` m 0,0 c 8,-8 8,8 0,0 c -8,-8 -8,8 0,0`;
    });
    const lastY = (steps.length - 1) * 200 + 100;
    d += ` C 50,${lastY + 100} 50,${lastY + 150} 50,${lastY + 250}`;
    return d;
  }, [invitation.event_program]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden touch-none" style={{ backgroundColor: invitation.envelope_color || '#F3F4F6' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .gold-shimmer {
          background: linear-gradient(90deg, #b8860b 0%, #fcd34d 50%, #b8860b 100%);
          background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 4s infinite linear; font-weight: 900;
        }
      `}</style>

      {/* ENVELOPPE */}
      <div className="relative w-full h-full flex items-center justify-center" style={{ opacity: view === 'envelope' ? 1 : 0, pointerEvents: view === 'envelope' ? 'auto' : 'none' }}>
        <div className="relative w-full max-w-[400px] h-full grid place-items-center">
            <motion.div animate={isOpened ? { y: -120, opacity: 1, scale: 1 } : { y: 20, opacity: 0, scale: 0.8 }} transition={{ type: "spring", damping: 25, stiffness: 40, delay: 0.4 }} className="row-start-1 col-start-1 w-[300px] h-[300px] z-20">
              <div className="w-full h-full rounded-full shadow-2xl bg-[#111] relative border-4 border-[#222]">
                <div className="absolute inset-0 opacity-40 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 bg-white rounded-full border-[8px] border-[#111] overflow-hidden">
                    {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div animate={isOpened ? { y: 120, opacity: 1, scale: 1 } : { y: 100, opacity: 0 }} transition={{ type: "spring", damping: 18, stiffness: 50, delay: 0.7 }} onClick={() => setView('content')} className={`row-start-1 col-start-1 z-30 w-[340px] h-[400px] rounded-[3.5rem] shadow-2xl p-10 flex flex-col items-center justify-between cursor-pointer border border-white/40 ${getPaperClass()}`}>
              <div className="text-center pt-10">
                <h2 className="text-3xl font-black uppercase text-gray-900" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                <div className="w-16 h-1 bg-amber-400 mx-auto mt-6 rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-10 opacity-40">{t.tap_open}</p>
              </div>
              <div className="w-full py-5 bg-gray-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] text-center">VOIR LES DÉTAILS</div>
            </motion.div>

            <motion.div animate={isOpened ? { y: '-100%', opacity: 0, pointerEvents: 'none' } : { y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }} className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: invitation.envelope_color }}>
              <button onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} className="w-80 h-80"><img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain" /></button>
            </motion.div>
        </div>
      </div>

      {/* CONTENU PROGRAMME */}
      <AnimatePresence>
        {view === 'content' && (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="relative h-[45vh] shrink-0 overflow-hidden">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <button onClick={() => setView('envelope')} className="absolute top-8 left-8 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-md"><X size={24}/></button>
            </div>

            <div className="flex-1 px-8 py-20 max-w-2xl mx-auto w-full space-y-32">
              <div className="text-center space-y-10">
                <h1 className="text-6xl font-black gold-shimmer leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                <div className="inline-flex items-center gap-4 bg-white/80 p-3 pr-8 rounded-full shadow-lg border border-amber-100">
                  <div className="bg-amber-500 p-3 rounded-full text-white shadow-md"><Calendar size={24}/></div>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-800">{invitation.event_date}</span>
                  <button onClick={addToCalendar} className="ml-4 p-2 bg-gray-100 rounded-full hover:bg-amber-100"><Plus size={20}/></button>
                </div>
              </div>

              {/* SECTION FIL D'OR MODIFIÉE UNIQUEMENT ICI */}
              <div ref={programAreaRef} className="relative py-10">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d={goldPath}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="1.2"
                    style={{ pathLength }}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_5px_rgba(212,175,55,0.4)]"
                  />
                </svg>

                <div className="relative space-y-[200px] w-full">
                  {(invitation.event_program || []).map((step: any, i: number) => (
                    <div key={i} className={`flex items-center w-full ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-500 rounded-full border-[3px] border-white shadow-xl z-20">
                        <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute inset-0 bg-amber-200 rounded-full" />
                      </div>
                      
                      <motion.div initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="w-[44%] p-8 bg-white/70 rounded-[2.5rem] border border-amber-100 backdrop-blur-md shadow-xl">
                        <span className="text-[10px] font-black text-amber-600 tracking-tighter uppercase mb-2 block"><Clock size={12} className="inline mr-1 mb-0.5"/> {step.time}</span>
                        <h4 className="text-xl font-bold leading-tight" style={{ fontFamily: invitation.font_style }}>{step.activity}</h4>
                      </motion.div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-32 relative">
                  <motion.button onClick={openMaps} className="relative inline-flex flex-col items-center gap-6 group">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border border-amber-100 text-amber-500 relative z-20 transition-transform group-hover:scale-110">
                      <MapPin size={36} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 group-hover:text-amber-600 transition-colors">{invitation.event_address}</span>
                  </motion.button>
                </div>
              </div>

              {/* RSVP */}
              <div className="bg-white/95 backdrop-blur-2xl rounded-[4rem] p-12 shadow-2xl border border-white">
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-10">
                    <h3 className="text-center font-black uppercase tracking-widest text-gray-700">{t.confirm_rsvp}</h3>
                    <div className="flex items-center gap-8 bg-gray-50/50 p-3 rounded-3xl border border-gray-100">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-14 h-14 bg-white rounded-2xl shadow-md font-black text-xl hover:bg-amber-50">-</button>
                      <div className="flex-1 text-center font-black text-3xl">{guestCount}</div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-14 h-14 bg-white rounded-2xl shadow-md font-black text-xl hover:bg-amber-50">+</button>
                    </div>
                    <div className="space-y-5">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                          <input required placeholder={t.first_name} className="bg-white/50 border-none h-16 px-6 rounded-2xl shadow-inner focus:ring-2 ring-amber-200 outline-none" value={guest.firstName} onChange={e => {
                            const ng = [...guests]; ng[i].firstName = e.target.value; setGuests(ng);
                          }} />
                          <input required placeholder={t.last_name} className="bg-white/50 border-none h-16 px-6 rounded-2xl shadow-inner focus:ring-2 ring-amber-200 outline-none" value={guest.lastName} onChange={e => {
                            const ng = [...guests]; ng[i].lastName = e.target.value; setGuests(ng);
                          }} />
                        </div>
                      ))}
                    </div>
                    <button disabled={isSubmitting} className="w-full h-20 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black">
                      {isSubmitting ? "..." : t.send}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-16 space-y-6">
                    <CheckCircle2 size={64} className="text-green-500 mx-auto" />
                    <h3 className="font-black uppercase tracking-widest text-green-600 text-xl">{t.thank_you}</h3>
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