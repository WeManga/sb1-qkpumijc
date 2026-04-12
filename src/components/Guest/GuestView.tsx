import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Volume2, VolumeX, MapPin, Clock, Send, CheckCircle2, Sparkles } from 'lucide-react';
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
          <motion.div key="env" className="relative w-full h-full flex flex-col items-center justify-center">
            
            {/* 1. CONTENEUR CENTRAL (DISQUE + CARTE) */}
            <div className="relative w-[320px] h-[450px] flex items-center justify-center">
                {/* DISQUE VINYLE */}
                <motion.div 
                initial={{ y: 0 }} 
                animate={isOpened ? { y: -140 } : { y: 0 }} 
                transition={{ type: "spring", damping: 25, stiffness: 80 }}
                className="absolute w-[280px] h-[280px] z-20"
                >
                <div className={`w-full h-full relative rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${isOpened ? 'animate-disk-spin' : ''}`}>
                    <div className="absolute inset-0 rounded-full bg-[#111]">
                    <div className="absolute inset-0 opacity-40 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full border-[6px] border-[#111] overflow-hidden">
                        {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
                    </div>
                    </div>
                </div>
                </motion.div>

                {/* CARTE D'APPEL */}
                <motion.div 
                initial={{ y: 0, scale: 0.8, opacity: 0 }} 
                animate={isOpened ? { y: 80, scale: 1, opacity: 1 } : { y: 0, opacity: 0 }} 
                transition={{ type: "spring", damping: 20, delay: 0.4 }}
                onClick={() => isOpened && setView('content')}
                className={`absolute z-30 w-full h-[380px] rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-between cursor-pointer border border-white/20 ${getPaperClass()} hover:scale-105 transition-transform`}
                >
                <div className="text-center pt-10">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                    <div className="w-10 h-1 bg-amber-400 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Découvrir le programme</p>
                </div>
                <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest shadow-lg">Voir les détails</div>
                </motion.div>
            </div>

            {/* 2. SYSTÈME D'ENVELOPPE RÉALISTE */}
            {!isOpened && (
              <motion.div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
                {/* Corps arrière */}
                <div className="absolute inset-0" style={{ backgroundColor: invitation.envelope_color }} />
                
                {/* Rabat supérieur (Volet) */}
                <motion.div 
                  initial={{ rotateX: 0 }}
                  exit={{ rotateX: -180, z: 100, transition: { duration: 0.8, ease: "easeInOut" } }}
                  style={{ 
                    backgroundColor: invitation.envelope_color, 
                    filter: 'brightness(90%)',
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    transformOrigin: 'top'
                  }}
                  className="absolute top-0 left-0 right-0 h-1/2 z-[55] shadow-xl"
                />

                {/* Sceau et bouton d'ouverture */}
                <motion.div exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.5 }} className="relative z-[60] flex flex-col items-center">
                  <button 
                    onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} 
                    className="w-72 h-72 hover:scale-110 transition-transform active:scale-95"
                  >
                    <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" />
                  </button>
                  <p className="text-white font-black text-xs uppercase tracking-[0.6em] mt-4 animate-bounce">Ouvrir l'invitation</p>
                </motion.div>

                {/* Côtés de l'enveloppe (Effet visuel) */}
                <div className="absolute inset-0 z-[50] pointer-events-none" style={{ 
                    background: `linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.05) 50%, transparent 52%), 
                                 linear-gradient(-45deg, transparent 48%, rgba(0,0,0,0.05) 50%, transparent 52%)` 
                }} />
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* VUE DÉTAILLÉE (FINALE) */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="relative h-[35vh] shrink-0">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover shadow-lg" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl text-gray-800"><X /></button>
            </div>

            <div className="flex-1 px-6 py-12 max-w-lg mx-auto w-full space-y-16">
              {/* TITRE ET HÔTES */}
              <div className="text-center space-y-6">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} className="text-[10px] font-black uppercase tracking-[0.5em] block">Invitation pour</motion.span>
                <div className="space-y-2">
                    <h2 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-2">{invitation.title}</h2>
                    <h1 className="text-4xl font-black leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                </div>
                <div className="flex flex-col items-center gap-4 text-xs font-bold opacity-60 uppercase tracking-widest pt-2">
                  <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full"><Calendar size={16} className="text-amber-500"/> {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</div>
                  <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event_address)}`, '_blank')} className="flex items-center gap-2 text-amber-600 underline hover:text-amber-700 transition-colors"><MapPin size={16}/> {invitation.event_address}</button>
                </div>
              </div>

              {/* PROGRAMME TIMELINE CENTRALE OR LENTE */}
              <div className="space-y-12">
                <h3 className="text-center font-black uppercase tracking-[0.4em] text-amber-600 text-[10px] flex items-center justify-center gap-3">
                    <div className="h-px w-8 bg-amber-200" /> Le Programme <div className="h-px w-8 bg-amber-200" />
                </h3>
                <div className="relative flex flex-col items-center">
                  <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ duration: 4, ease: "easeInOut" }} className="absolute top-0 w-[4px] bg-gradient-to-b from-amber-200 via-amber-500 to-amber-200 rounded-full" />
                  
                  <div className="relative space-y-20 w-full pt-10">
                    {invitation.event_program?.map((step: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 1.5, delay: i * 0.3 }} 
                        key={i} 
                        className={`flex items-center w-full ${i % 2 === 0 ? 'justify-start pl-8' : 'justify-end pr-8'}`}
                      >
                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-amber-500 z-10 shadow-lg flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                        <div className={`w-[42%] p-5 bg-white/60 rounded-[2rem] border border-amber-100 backdrop-blur-md shadow-xl ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                          <span className="text-[10px] font-black text-amber-600 block mb-1">{step.time}</span>
                          <span className="text-lg font-bold uppercase tracking-tighter leading-none block" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RSVP DYNAMIQUE */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[3.5rem] p-10 shadow-2xl border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="font-black uppercase tracking-[0.2em] text-sm">Confirmation de présence</h3>
                      <p className="text-[9px] font-bold opacity-40 uppercase">Veuillez indiquer le nombre de personnes</p>
                    </div>

                    <div className="flex items-center gap-6 bg-gray-100/50 p-3 rounded-2xl">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-12 h-12 bg-white rounded-xl shadow-md font-bold text-xl hover:bg-amber-50 transition-colors">-</button>
                      <div className="flex-1 text-center font-black text-2xl">{guestCount}</div>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-12 h-12 bg-white rounded-xl shadow-md font-bold text-xl hover:bg-amber-50 transition-colors">+</button>
                    </div>

                    <div className="space-y-4">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
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

                    <button disabled={isSubmitting} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-black">
                      {isSubmitting ? "Envoi..." : <><Send size={18} className="text-amber-400"/> Confirmer</>}
                    </button>
                  </form>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10 space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} className="text-green-500" />
                    </div>
                    <h3 className="font-black uppercase tracking-widest text-green-600">C'est validé !</h3>
                    <p className="text-xs font-bold opacity-60 uppercase">Nous avons bien reçu votre confirmation.</p>
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