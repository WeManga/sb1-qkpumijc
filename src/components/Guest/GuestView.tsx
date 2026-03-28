import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { ProgramSection } from './ProgramSection';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Loader2, 
  MapPin, 
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  X
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

  // RSVP States
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

  // Musique à l'ouverture de l'enveloppe
  useEffect(() => {
    if (view !== 'envelope' && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => console.log("Audio blocked"));
    }
  }, [view, invitation?.music_url]);

  // Composant Pluie d'émojis
  const EmojiRain = () => {
    const particles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2
    })), [emojis]);

    return (
      <div className="fixed inset-0 z-[80] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span 
            key={p.id} 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 1000, opacity: [0, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
            className="absolute text-2xl" 
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
        {/* ÉTAPE 1 : L'ENVELOPPE FERMÉE */}
        {view === 'envelope' && (
          <motion.div 
            key="step1"
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
            style={{ backgroundColor: invitation?.envelope_color || '#FEE2E2' }}
            onClick={() => setView('card')}
          >
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30"
            >
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </motion.div>
            <p className="text-white font-black text-[10px] uppercase tracking-[0.5em] mt-8">Ouvrir</p>
          </motion.div>
        )}

        {/* ÉTAPE 2 : LE DISQUE ET LA CARTE (Design Preview Corrigé) */}
        {view === 'card' && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-[#F5F5F7]"
          >
            <div className="relative w-full max-w-md h-[550px] flex flex-col items-center justify-center">
              
              {/* LE DISQUE VINYLE (Corrigé : sans carré) */}
              <motion.div 
                initial={{ y: 200, rotate: -20, opacity: 0 }}
                animate={{ y: -120, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
                className="absolute w-52 h-52 z-10"
              >
                <div className="w-full h-full relative animate-disk-spin rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-[#111]">
                   <div className="absolute inset-0 rounded-full" style={{ background: 'repeating-radial-gradient(circle, #333 0, #000 2px, #111 4px)' }} />
                   <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-30 rounded-full" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-16 h-16 rounded-full border-[6px] border-[#111] overflow-hidden bg-white shadow-inner">
                       {invitation.main_photo_url ? (
                         <img src={invitation.main_photo_url} className="w-full h-full object-cover rounded-full" />
                       ) : (
                         <div className="w-full h-full bg-amber-100 rounded-full" />
                       )}
                     </div>
                   </div>
                </div>
              </motion.div>

              {/* LA CARTE */}
              <motion.div 
                initial={{ y: 350 }} animate={{ y: 80 }}
                transition={{ type: "spring", damping: 25, delay: 0.4 }}
                className="z-20 w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 text-center relative paper-texture"
              >
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-2">{invitation.title}</h2>
                <div className="w-10 h-1 bg-amber-400 mx-auto mb-6 rounded-full" />
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-10">{invitation.host_names}</p>
                <button 
                  onClick={() => setView('content')}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl"
                >
                  Découvrir les détails
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 3 : LE FAIRE-PART COMPLET (Contenu) */}
        {view === 'content' && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="relative z-10 w-full"
          >
            {/* Header Photo */}
            <div className="h-[50vh] relative overflow-hidden">
              <img src={invitation.main_photo_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent" />
              <button 
                onClick={() => setView('card')}
                className="absolute top-6 left-6 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
              >
                <X size={20}/>
              </button>
              
              {invitation?.music_url && (
                <button 
                  onClick={() => { if(audioRef.current) audioRef.current.muted = !isMuted; setIsMuted(!isMuted); }}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                >
                  {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} className="animate-pulse text-amber-500"/>}
                </button>
              )}
            </div>

            <div className="max-w-2xl mx-auto px-6 -mt-20 relative z-20 pb-20 text-center">
              <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[3rem] shadow-xl border border-white mb-10">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] block mb-4 italic">
                  {invitation.event_type || 'Event'}
                </span>
                <h1 className="text-3xl font-bold mb-4">{invitation.title}</h1>
                <div className="flex flex-col gap-3 text-gray-500 text-sm items-center">
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar size={16} className="text-amber-400"/> 
                    {new Date(invitation.event_date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin size={16} className="text-amber-400"/> 
                    {invitation.event_address}
                  </div>
                </div>
              </div>

              {/* Timeline Animée */}
              <ProgramSection program={invitation.event_program || []} />

              {/* Formulaire RSVP */}
              {!submitted ? (
                <div className="mt-20 bg-amber-50/50 p-8 rounded-[3rem] border border-amber-100 shadow-sm">
                  <div className="mb-8">
                    <Users className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <h2 className="font-bold text-xl text-gray-800">{t.confirm_rsvp}</h2>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="flex items-center justify-center gap-8 bg-white p-4 rounded-2xl shadow-inner border border-amber-100">
                        <button type="button" onClick={() => handleCountChange(count - 1)} className="text-2xl font-bold text-amber-400 w-10 h-10">-</button>
                        <span className="text-3xl font-black text-gray-700">{count}</span>
                        <button type="button" onClick={() => handleCountChange(count + 1)} className="text-2xl font-bold text-amber-400 w-10 h-10">+</button>
                     </div>
                     <div className="space-y-4">
                       {guests.map((g, i) => (
                         <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 space-y-3">
                           <p className="text-[9px] font-black uppercase text-gray-300 text-left">Invité {i + 1}</p>
                           <div className="grid grid-cols-2 gap-2">
                             <input placeholder="Prénom" className="p-3 bg-gray-50 rounded-xl text-sm w-full border-none" onChange={e => {const n=[...guests]; n[i].prenom=e.target.value; setGuests(n)}} required />
                             <input placeholder="Nom" className="p-3 bg-gray-50 rounded-xl text-sm w-full border-none" onChange={e => {const n=[...guests]; n[i].nom=e.target.value; setGuests(n)}} required />
                           </div>
                         </div>
                       ))}
                     </div>
                     <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-amber-400 to-rose-400 text-white rounded-[2.5rem] font-bold shadow-lg uppercase tracking-widest text-xs">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : t.send}
                     </button>
                  </form>
                </div>
              ) : (
                <div className="mt-20 bg-white p-12 rounded-[3rem] text-center shadow-2xl border border-green-50">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                  <h3 className="font-bold text-2xl text-gray-800 mb-2">{t.thank_you}</h3>
                  <p className="text-gray-400 italic">{t.success_msg}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}