import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Volume2, VolumeX, MapPin, Clock, Users, Send, CheckCircle2, Sparkles } from 'lucide-react';
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
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center">
            
            {/* 1. DISQUE VINYLE (SANS CARRÉ DERRIÈRE) */}
            <motion.div 
              initial={{ y: 0, x: '-50%' }} 
              animate={isOpened ? { y: -180 } : { y: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 80 }}
              className="absolute top-1/2 left-1/2 w-[280px] h-[280px] z-20 bg-transparent"
            >
              <div className={`w-full h-full relative rounded-full ${isOpened ? 'animate-disk-spin' : ''}`}>
                <div className="absolute inset-0 rounded-full bg-[#111] shadow-[0_0_50px_rgba(0,0,0,0.4)]">
                   <div className="absolute inset-0 opacity-40 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white rounded-full border-[6px] border-[#111] overflow-hidden">
                    {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. CARTE D'APPEL (REPOSITIONNÉE PLUS HAUT) */}
            <motion.div 
              initial={{ y: 50, x: '-50%', scale: 0.8, opacity: 0 }} 
              animate={isOpened ? { y: 80, scale: 1, opacity: 1 } : { y: 50, opacity: 0 }} 
              transition={{ type: "spring", damping: 20, delay: 0.4 }}
              onClick={() => isOpened && setView('content')}
              className={`absolute top-1/2 left-1/2 z-30 w-[320px] h-[380px] rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-between cursor-pointer border border-white/20 ${getPaperClass()} hover:translate-y-[75px] transition-transform`}
            >
              <div className="text-center pt-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                <div className="w-10 h-1 bg-amber-400 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Cliquez pour le programme</p>
              </div>
              <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">Voir les détails</div>
            </motion.div>

            {/* 3. ENVELOPPE AVEC ANIMATION D'OUVERTURE DU RABAT */}
            {!isOpened && (
              <motion.div className="absolute inset-0 z-50 flex items-center justify-center">
                {/* Corps de l'enveloppe */}
                <div className="absolute inset-0" style={{ backgroundColor: invitation.envelope_color }} />
                
                {/* Animation Sceau + Rabat */}
                <motion.div 
                   exit={{ y: -200, opacity: 0, scale: 0.8 }} 
                   transition={{ duration: 0.8 }}
                   className="relative z-50 flex flex-col items-center"
                >
                  <button 
                    onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} 
                    className="w-72 h-72 hover:scale-110 transition-transform active:scale-95 relative"
                  >
                    <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" />
                  </button>
                  <p className="text-white font-black text-xs uppercase tracking-[0.5em] mt-4 animate-pulse">Ouvrir</p>
                </motion.div>

                {/* Volet supérieur qui s'ouvre */}
                <motion.div 
                  initial={{ scaleY: 1 }}
                  exit={{ scaleY: -1, y: '-100%', originY: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute top-0 left-0 right-0 h-1/2 z-[45] origin-top"
                  style={{ backgroundColor: invitation.envelope_color, filter: 'brightness(95%)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                />
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* VUE DÉTAILLÉE COMPLÈTE */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="relative h-[35vh] shrink-0">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"><X /></button>
            </div>

            <div className="flex-1 px-6 py-10 max-w-lg mx-auto w-full space-y-16">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-black" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                <div className="flex flex-col items-center gap-3 text-xs font-bold opacity-60 uppercase tracking-widest pt-2">
                  <div className="flex items-center gap-2"><Calendar size={18} className="text-amber-500"/> {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</div>
                  <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event_address)}`, '_blank')} className="flex items-center gap-2 text-amber-600 underline"><MapPin size={18}/> {invitation.event_address}</button>
                </div>
              </div>

              {/* PROGRAMME TIMELINE CENTRALE OR */}
              <div className="space-y-12">
                <h3 className="text-center font-black uppercase tracking-[0.4em] text-amber-600 text-[10px]">Le Programme</h3>
                <div className="relative flex flex-col items-center">
                  <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ duration: 3, ease: "easeInOut" }} className="absolute top-0 w-[3px] bg-gradient-to-b from-amber-200 via-amber-500 to-amber-200 rounded-full" />
                  
                  <div className="relative space-y-16 w-full pt-4">
                    {invitation.event_program?.map((step: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        whileInView={{ opacity: 1, scale: 1 }} 
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.4 }} 
                        key={i} 
                        className={`flex items-center w-full ${i % 2 === 0 ? 'justify-start pl-8' : 'justify-end pr-8'}`}
                      >
                        <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-4 border-amber-500 z-10" />
                        <div className={`w-[40%] p-4 bg-white/40 rounded-2xl border border-amber-100 backdrop-blur-sm ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                          <span className="text-[10px] font-black text-amber-600 block">{step.time}</span>
                          <span className="text-md font-bold uppercase tracking-tight" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RSVP */}
              <div className="bg-white/50 backdrop-blur-md rounded-[3rem] p-8 shadow-xl border border-white">
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-6">
                    <div className="text-center">
                      <h3 className="font-black uppercase tracking-widest text-sm">Confirmation de présence</h3>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">-</button>
                      <div className="flex-1 text-center font-black">{guestCount} convives</div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">+</button>
                    </div>

                    <div className="space-y-3">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95">
                          <input required placeholder="Prénom" className="bg-white/80 border-none h-12 px-4 rounded-xl text-sm shadow-sm" value={guest.firstName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].firstName = e.target.value;
                            setGuests(newGuests);
                          }} />
                          <input required placeholder="Nom" className="bg-white/80 border-none h-12 px-4 rounded-xl text-sm shadow-sm" value={guest.lastName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].lastName = e.target.value;
                            setGuests(newGuests);
                          }} />
                        </div>
                      ))}
                    </div>

                    <button disabled={isSubmitting} className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2">
                      {isSubmitting ? "Envoi..." : <><Send size={18}/> Confirmer</>}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle2 size={48} className="text-green-500 mx-auto" />
                    <h3 className="font-black uppercase tracking-widest text-green-600">C'est validé !</h3>
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