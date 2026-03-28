import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { ProgramSection } from './ProgramSection';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Loader2, 
  MapPin, 
  X,
  Volume2,
  VolumeX,
  ExternalLink
} from 'lucide-react';

const THEME_EMOJIS: Record<string, string[]> = {
  wedding: ['🤍', '💍', '🕊️', '✨', '🌸'],
  birthday: ['🎂', '🎈', '✨', '🎉', '🍰'],
  party: ['✨', '🎸', '🥂', '🕺', '🌟'],
  baptism: ['👼', '☁️', '🤍', '✨', '🕊️'],
  default: ['✨', '🌟', '🤍']
};

interface GuestViewProps {
  invitation: any;
}

export function GuestView({ invitation }: GuestViewProps) {
  const [view, setView] = useState<'envelope' | 'card' | 'content'>('envelope');
  const [lang, setLang] = useState<Language>('fr');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [count, setCount] = useState(1);
  const [guests, setGuests] = useState([{ nom: '', prenom: '', age: '' }]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = translations[lang].guest;
  const emojis = THEME_EMOJIS[invitation?.event_type] || THEME_EMOJIS.default;

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'fr', 'vi'].includes(browserLang)) setLang(browserLang);
  }, []);

  useEffect(() => {
    if (view !== 'envelope' && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => console.log("Audio blocked"));
    }
  }, [view, invitation?.music_url]);

  const EmojiRain = () => {
    const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 4
    })), [emojis]);

    return (
      <div className="fixed inset-0 z-[80] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span 
            key={p.id} 
            initial={{ y: -100, opacity: 0 }} 
            animate={{ y: 1200, opacity: [0, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
            className="absolute text-3xl" 
            style={{ left: p.left }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  const handleCountChange = (newCount: number) => {
    const val = Math.max(1, Math.min(newCount, 10));
    setCount(val);
    setGuests(Array.from({ length: val }, (_, i) => guests[i] || { nom: '', prenom: '', age: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('responses').insert([{
        invitation_id: invitation.id,
        group_leader_name: `${guests[0].prenom} ${guests[0].nom}`,
        guest_details: guests,
        total_guests: count
      }]);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) { alert("Erreur d'envoi"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] overflow-x-hidden">
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {view !== 'envelope' && <EmojiRain />}

      <AnimatePresence mode="wait">
        {view === 'envelope' && (
          <motion.div 
            key="step1"
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
            style={{ backgroundColor: invitation?.envelope_color || '#FEE2E2' }}
            onClick={() => setView('card')}
          >
            <motion.div whileHover={{ scale: 1.1 }} className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl">
              <span className="text-4xl animate-pulse">✨</span>
            </motion.div>
            <p className="text-white font-black text-[10px] uppercase tracking-[0.5em] mt-8">Ouvrir</p>
          </motion.div>
        )}

        {view === 'card' && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[90] flex items-center justify-center px-4">
            <div className="relative w-full max-w-md h-[550px] flex flex-col items-center justify-center">
              
              <motion.div 
                initial={{ y: 250, rotate: -15, opacity: 0 }}
                animate={{ y: [-120, -135, -120], rotate: 0, opacity: 1 }}
                transition={{ 
                  y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                  rotate: { type: "spring", damping: 15 },
                  default: { duration: 0.6 }
                }}
                className="absolute w-52 h-52 z-10"
              >
                <div className="w-full h-full relative animate-disk-spin rounded-full overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.4)] border-4 border-[#111]">
                   <div className="absolute inset-0" style={{ background: 'repeating-radial-gradient(circle, #333 0, #000 2px, #111 4px)' }} />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-16 h-16 rounded-full border-[6px] border-[#111] overflow-hidden bg-white shadow-inner">
                        <img src={invitation.main_photo_url} className="w-full h-full object-cover rounded-full" />
                     </div>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 500, scale: 0.8 }}
                animate={{ y: 80, scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 90, delay: 0.3 }}
                className="z-20 w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 text-center relative paper-texture"
              >
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter mb-2">{invitation.title}</h2>
                <div className="w-12 h-1 bg-amber-400 mx-auto mb-6 rounded-full" />
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 italic">{invitation.host_names}</p>
                <button 
                  onClick={() => setView('content')}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl"
                >
                  Découvrir les détails
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {view === 'content' && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full">
            <div className="h-[50vh] relative overflow-hidden">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button onClick={() => setView('card')} className="absolute top-6 left-6 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg"><X size={20}/></button>
            </div>

            <div className="max-w-2xl mx-auto px-6 -mt-20 relative z-20 pb-20">
              <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[3rem] shadow-xl border border-white mb-10 text-center">
                <h1 className="text-4xl font-black mb-6 tracking-tighter">{invitation.title}</h1>
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Calendar size={18} className="text-amber-400"/> 
                    {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}
                  </div>
                  
                  <a 
                    href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(invitation.title)}&dates=${new Date(invitation.event_date).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(invitation.event_date).toISOString().replace(/-|:|\.\d\d\d/g, "")}&location=${encodeURIComponent(invitation.event_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-6 py-3 rounded-full hover:bg-amber-200 transition-colors"
                  >
                    Ajouter au calendrier
                  </a>
                </div>
              </div>

              <ProgramSection program={invitation.event_program || []} />

              {/* SECTION ADRESSE & MAP SANS ERREUR API */}
              <div className="mt-20 bg-white p-8 rounded-[3.5rem] shadow-xl border border-gray-50 text-center">
                 <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-2">
                       <MapPin className="text-amber-500 w-6 h-6" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest px-4">{invitation.event_address}</span>
                 </div>
                 
                 <div className="w-full h-64 rounded-[2.5rem] overflow-hidden bg-gray-100 relative shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
                      className="w-full h-full object-cover opacity-40 grayscale"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-amber-500 flex items-center gap-2 transition-all transform hover:scale-105"
                      >
                        Ouvrir l'itinéraire <ExternalLink size={14} />
                      </a>
                    </div>
                 </div>
              </div>

              {!submitted ? (
                <div className="mt-16 bg-amber-50/50 p-8 rounded-[3.5rem] border border-amber-100 text-center">
                  <Users className="w-8 h-8 text-amber-400 mx-auto mb-4" />
                  <h2 className="font-bold text-xl mb-8">Confirmer votre venue</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="flex items-center justify-center gap-8 bg-white p-4 rounded-2xl shadow-inner border border-amber-100">
                        <button type="button" onClick={() => handleCountChange(count - 1)} className="text-2xl font-bold text-amber-400 w-12 h-12">-</button>
                        <span className="text-3xl font-black">{count}</span>
                        <button type="button" onClick={() => handleCountChange(count + 1)} className="text-2xl font-bold text-amber-400 w-12 h-12">+</button>
                     </div>
                     <div className="space-y-4 text-left">
                       {guests.map((g, i) => (
                         <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                           <div className="grid grid-cols-2 gap-3">
                             <input placeholder="Prénom" className="p-4 bg-gray-50 rounded-2xl text-sm border-none w-full" onChange={e => {const n=[...guests]; n[i].prenom=e.target.value; setGuests(n)}} required />
                             <input placeholder="Nom" className="p-4 bg-gray-50 rounded-2xl text-sm border-none w-full" onChange={e => {const n=[...guests]; n[i].nom=e.target.value; setGuests(n)}} required />
                           </div>
                         </div>
                       ))}
                     </div>
                     <button type="submit" disabled={loading} className="w-full py-6 bg-gray-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : "Envoyer ma réponse"}
                     </button>
                  </form>
                </div>
              ) : (
                <div className="mt-16 bg-white p-12 rounded-[4rem] text-center shadow-2xl border border-green-50">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                  <h3 className="font-black text-2xl text-gray-800">Merci !</h3>
                  <p className="text-gray-400 mt-2 italic">Votre réponse est enregistrée.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}