import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Volume2, VolumeX, MapPin, Clock, Users, Send, CheckCircle2 } from 'lucide-react';
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
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event_address)}`;
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
            {/* DISQUE VINYLE CENTRÉ */}
            <motion.div 
              initial={{ y: 0, x: '-50%' }} 
              animate={isOpened ? { y: -220 } : { y: 0 }} 
              transition={{ type: "spring", damping: 20 }}
              className="absolute top-1/2 left-1/2 w-[280px] h-[280px] z-20"
            >
              <div className={`w-full h-full relative ${isOpened ? 'animate-disk-spin' : ''}`}>
                <div className="absolute inset-0 rounded-full bg-[#111] shadow-2xl">
                   <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
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
              initial={{ y: 100, x: '-50%', scale: 0.9 }} 
              animate={isOpened ? { y: 140, scale: 1 } : { y: 100 }} 
              transition={{ type: "spring", damping: 20 }}
              onClick={() => isOpened && setView('content')}
              className={`absolute top-1/2 left-1/2 z-30 w-[320px] h-[380px] rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-between cursor-pointer ${getPaperClass()}`}
            >
              <div className="text-center pt-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: invitation.font_style }}>{invitation.title}</h2>
                <div className="w-10 h-1 bg-amber-400 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Cliquez pour le programme</p>
              </div>
              <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">Voir les détails</div>
            </motion.div>

            {/* ENVELOPPE / SCEAU */}
            {!isOpened && (
              <motion.div exit={{ y: -1000 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: invitation.envelope_color }}>
                <button onClick={() => { setIsOpened(true); audioRef.current?.play(); }} className="w-80 h-80 hover:scale-110 transition-transform">
                  <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-full h-full object-contain drop-shadow-2xl" />
                </button>
                <p className="text-white font-black text-xs uppercase tracking-[0.5em] mt-4">Ouvrir</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* VUE DÉTAILLÉE COMPLÈTE */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="relative h-[40vh] shrink-0">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"><X /></button>
            </div>

            <div className="flex-1 px-6 py-10 max-w-lg mx-auto w-full space-y-12">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-black" style={{ fontFamily: invitation.font_style }}>{invitation.host_names}</h1>
                <div className="flex flex-col items-center gap-3 text-sm font-bold opacity-60 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Calendar size={18} className="text-amber-500"/> {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</div>
                  <button onClick={openGoogleMaps} className="flex items-center gap-2 text-amber-600 underline underline-offset-4"><MapPin size={18}/> {invitation.event_address}</button>
                </div>
              </div>

              {/* PROGRAMME ANIMÉ (TIMELINE) */}
              <div className="space-y-8">
                <h3 className="text-center font-black uppercase tracking-[0.4em] text-amber-600 text-xs">Le Programme</h3>
                <div className="relative ml-4">
                  <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ duration: 1.5, ease: "easeInOut" }} className="absolute left-0 top-0 w-[2px] bg-amber-200" />
                  <div className="space-y-10 pl-8">
                    {invitation.event_program?.map((step: any, i: number) => (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.2) }} key={i} className="relative">
                        <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-white" />
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-amber-600">{step.time}</span>
                          <span className="text-lg font-bold uppercase tracking-tight" style={{ fontFamily: invitation.font_style }}>{step.activity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FORMULAIRE RSVP DYNAMIQUE CONNECTÉ */}
              <div className="bg-white/50 backdrop-blur-md rounded-[3rem] p-8 shadow-xl border border-white">
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="font-black uppercase tracking-widest">Serez-vous des nôtres ?</h3>
                      <p className="text-[10px] font-bold opacity-50 uppercase">Réponse souhaitée avant le 15/05</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase opacity-40 ml-2">Nombre d'invités</label>
                      <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl">
                        <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">-</button>
                        <div className="flex-1 text-center font-black">{guestCount}</div>
                        <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">+</button>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {guests.map((guest, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                          <input required placeholder="Prénom" className="bg-white border-none h-12 px-4 rounded-xl text-sm" value={guest.firstName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].firstName = e.target.value;
                            setGuests(newGuests);
                          }} />
                          <input required placeholder="Nom" className="bg-white border-none h-12 px-4 rounded-xl text-sm" value={guest.lastName} onChange={e => {
                            const newGuests = [...guests];
                            newGuests[i].lastName = e.target.value;
                            setGuests(newGuests);
                          }} />
                        </div>
                      ))}
                    </div>

                    <button disabled={isSubmitting} className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-200 flex items-center justify-center gap-2">
                      {isSubmitting ? "Envoi..." : <><Send size={18}/> Confirmer</>}
                    </button>
                  </form>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10 space-y-4">
                    <CheckCircle2 size={48} className="text-green-500 mx-auto" />
                    <h3 className="font-black uppercase tracking-widest text-green-600">C'est noté !</h3>
                    <p className="text-sm font-bold opacity-60">Merci pour votre réponse, nous avons hâte de vous voir.</p>
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