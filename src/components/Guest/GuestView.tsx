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

  const openGoogleMaps = () => {
    if (!invitation.event_address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=0{encodeURIComponent(invitation.event_address)}`;
    window.open(url, '_blank');
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
            
            {/* 1. DISQUE VINYLE CENTRÉ */}
            <motion.div 
              initial={{ y: 0, x: '-50%' }} 
              animate={isOpened ? { y: -240 } : { y: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 100 }}
              className="absolute top-1/2 left-1/2 w-[300px] h-[300px] z-20"
            >
              <div className={`w-full h-full relative ${isOpened ? 'animate-disk-spin' : ''}`}>
                <div className="absolute inset-0 rounded-full bg-[#111] shadow-2xl">
                   <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 bg-white rounded-full border-[6px] border-[#111] overflow-hidden">
                    {invitation.main_photo_url && <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. CARTE D'APPEL (REPOSITIONNÉE ET AJUSTÉE) */}
            <motion.div 
              initial={{ y: 120, x: '-50%', scale: 0.9, opacity: 0 }} 
              animate={isOpened ? { y: 130, scale: 1, opacity: 1 } : { y: 120, opacity: 0 }} 
              transition={{ type: "spring", damping: 22, delay: 0.3 }}
              onClick={() => isOpened && setView('content')}
              className={`absolute top-1/2 left-1/2 z-30 w-[350px] h-[420px] rounded-[3.5rem] shadow-2xl p-10 flex flex-col items-center justify-between cursor-pointer border border-white/20 ${getPaperClass()} hover:scale-[1.03] transition-transform`}
            >
              <div className="text-center pt-16">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-5 leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                <div className="w-12 h-1.5 bg-amber-400 mx-auto mb-6 rounded-full" />
                <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 animate-pulse">Découvrir l'univers</p>
              </div>
              <div className="w-full py-5 bg-gray-900 text-white rounded-3xl text-[11px] font-black uppercase text-center tracking-widest shadow-xl">Voir les détails</div>
            </motion.div>

            {/* ENVELOPPE / SCEAU */}
            {!isOpened && (
              <motion.div exit={{ y: -1000, opacity: 0 }} transition={{ duration: 0.8, ease: "easeInOut" }} className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: invitation.envelope_color }}>
                <button onClick={() => { setIsOpened(true); audioRef.current?.play().catch(()=>{}); }} className="w-80 h-80 hover:scale-110 transition-transform active:scale-95">
                  <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" />
                </button>
                <p className="text-white font-black text-xs uppercase tracking-[0.6em] mt-6 animate-pulse">Ouvrir l'invitation</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* VUE DÉTAILLÉE COMPLÈTE (FINALE) */
          <motion.div key="content" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="relative h-[35vh] shrink-0 overflow-hidden">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10" />
              <button onClick={() => setView('envelope')} className="absolute top-8 left-8 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-gray-800"><X /></button>
            </div>

            <div className="flex-1 px-8 py-12 max-w-lg mx-auto w-full space-y-16">
              <div className="text-center space-y-5">
                <h1 className="text-5xl font-black leading-tight tracking-tight" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                <div className="flex flex-col items-center gap-4 text-xs font-bold opacity-70 uppercase tracking-[0.2em] pt-2">
                  <div className="flex items-center gap-3"><Calendar size={18} className="text-amber-500"/> {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</div>
                  <button onClick={openGoogleMaps} className="flex items-center gap-3 text-amber-700 underline underline-offset-4 hover:text-amber-800 transition-colors"><MapPin size={18}/> {invitation.event_address}</button>
                </div>
              </div>

              {/* PROGRAMME ANIMÉ (TIMELINE CENTRALE OR ET LENTE) */}
              <div className="space-y-12">
                <h3 className="text-center font-black uppercase tracking-[0.5em] text-amber-600 text-[11px] flex items-center justify-center gap-3">
                    <Sparkles size={14} className="text-amber-400"/> Programme <Sparkles size={14} className="text-amber-400"/>
                </h3>
                
                {/* Ligne Centrale D'or */}
                <div className="relative flex flex-col items-center">
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '100%' }} 
                    transition={{ duration: 3.5, ease: "easeInOut" }} 
                    className="absolute top-0 bottom-0 w-[4px] rounded-full" 
                    style={{ background: 'linear-gradient(to bottom, #FBBF24, #F59E0B, #FBBF24)' }}
                  />
                  
                  {/* Contenu de la Timeline */}
                  <div className="relative space-y-16 w-full pt-10 pb-6">
                    {invitation.event_program?.map((step: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        whileInView={{ opacity: 1, scale: 1 }} 
                        viewport={{ once: true, amount: 0.8 }}
                        transition={{ duration: 1.2, delay: i * 0.4, ease: "easeOut" }} 
                        key={i} 
                        className={`flex items-center w-full ${i % 2 === 0 ? 'justify-start pl-10' : 'justify-end pr-10'}`}
                      >
                        {/* Point d'ancrage Central */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 shadow-xl flex items-center justify-center z-10" style={{ borderColor: '#F59E0B' }}>
                            <div className="w-3 h-3 rounded-full bg-amber-600 shadow-inner" />
                        </div>
                        
                        {/* Bulle de Programme */}
                        <div className={`w-[42%] bg-white/60 p-6 rounded-3xl shadow-lg border border-amber-100 backdrop-blur-sm ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                          <div className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
                            <span className="text-xs font-black text-amber-600 flex items-center gap-1.5"><Clock size={12}/> {step.time}</span>
                            <span className="text-xl font-bold uppercase tracking-tight mt-1" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FORMULAIRE RSVP DYNAMIQUE CONNECTÉ */}
              <div className="bg-white/50 backdrop-blur-md rounded-[3.5rem] p-10 shadow-xl border border-white">
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-8">
                    <div className="text-center space-y-3">
                      <h3 className="font-black uppercase tracking-[0.3em] text-sm">Serez-vous des nôtres ?</h3>
                      <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Une réponse est souhaitée pour l'organisation</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase opacity-40 ml-2 tracking-widest">Nombre de convives</label>
                      <div className="flex items-center gap-5 bg-gray-50 p-2 rounded-2xl shadow-inner">
                        <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-12 h-12 bg-white rounded-xl shadow-md font-bold text-lg active:scale-95 transition-transform">-</button>
                        <div className="flex-1 text-center font-black text-2xl">{guestCount}</div>
                        <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-12 h-12 bg-white rounded-xl shadow-md font-bold text-lg active:scale-95 transition-transform">+</button>
                      </div>
                    </div>

                    <div className="space-y-5 max-h-72 overflow-y-auto pr-3 custom-scrollbar">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                          <input required placeholder="Prénom" className="bg-white border-none h-14 px-5 rounded-xl text-sm shadow-sm" value={guest.firstName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].firstName = e.target.value;
                            setGuests(newGuests);
                          }} />
                          <input required placeholder="Nom" className="bg-white border-none h-14 px-5 rounded-xl text-sm shadow-sm" value={guest.lastName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].lastName = e.target.value;
                            setGuests(newGuests);
                          }} />
                        </div>
                      ))}
                    </div>

                    <button disabled={isSubmitting} className="w-full h-16 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-lg shadow-amber-200 flex items-center justify-center gap-3 transition-colors hover:bg-amber-600 disabled:opacity-50">
                      {isSubmitting ? "Envoi en cours..." : <><Send size={18}/> Confirmer la présence</>}
                    </button>
                  </form>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{duration: 0.5}} className="text-center py-12 space-y-5">
                    <CheckCircle2 size={56} className="text-green-500 mx-auto" />
                    <h3 className="font-black uppercase tracking-[0.3em] text-green-600 text-sm">C'est noté !</h3>
                    <p className="text-sm font-bold opacity-60">Merci pour votre réponse, nous avons hâte de partager ce moment.</p>
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