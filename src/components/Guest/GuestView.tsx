import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { InvitationCard } from './InvitationCard'; // Le vinyle et l'enveloppe
import { ProgramSection } from './ProgramSection'; // La timeline animée
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
  VolumeX
} from 'lucide-react';

interface GuestViewProps {
  invitation: any;
}

export function GuestView({ invitation }: GuestViewProps) {
  const [lang, setLang] = useState<Language>('fr');
  const [isOpened, setIsOpened] = useState(false); // État pour l'enveloppe
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'fr', 'vi'].includes(browserLang)) {
      setLang(browserLang);
    }
  }, []);

  // Gestion de la musique
  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => console.log("Musique bloquée par le navigateur"));
    }
  }, [isOpened, invitation?.music_url]);

  const t = translations[lang].guest;

  const [count, setCount] = useState(1);
  const [guests, setGuests] = useState([{ nom: '', prenom: '', age: '' }]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSaveDate = () => {
    const dateStr = invitation.event_date ? invitation.event_date.replace(/-|:|\.\d+/g, "") : "";
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${dateStr}\nSUMMARY:${invitation.title}\nLOCATION:${invitation.event_address}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'invitation.ics');
    link.click();
  };

  const handleCountChange = (newCount: number) => {
    const val = Math.max(1, Math.min(newCount, 10));
    setCount(val);
    const newGuests = Array.from({ length: val }, (_, i) => guests[i] || { nom: '', prenom: '', age: '' });
    setGuests(newGuests);
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
    } catch (err) {
      alert("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  // 1. ÉCRAN D'OUVERTURE (L'enveloppe et le vinyle)
  if (!isOpened) {
    return (
      <InvitationCard 
        invitation={invitation} 
        onViewFull={() => setIsOpened(true)} 
      />
    );
  }

  // 2. VUE COMPLÈTE (Après clic sur "Découvrir")
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-white font-sans text-gray-900 pb-20"
    >
      {/* Musique invisible */}
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      
      {/* Header avec Photo */}
      <div className="h-[60vh] relative overflow-hidden">
        {invitation.main_photo_url ? (
          <img src={invitation.main_photo_url} className="w-full h-full object-cover" alt="Event" />
        ) : (
          <div className="w-full h-full bg-amber-50 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-amber-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        
        {/* Bouton Mute flottant */}
        {invitation?.music_url && (
          <button 
            onClick={() => { if(audioRef.current) audioRef.current.muted = !isMuted; setIsMuted(!isMuted); }}
            className="absolute top-6 right-6 z-50 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl"
          >
            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20} className="animate-pulse text-amber-600"/>}
          </button>
        )}
      </div>

      {/* Infos Principales */}
      <div className="max-w-2xl mx-auto px-6 -mt-32 relative z-10 text-center">
        <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[3rem] shadow-xl border border-white mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4 block italic">
            {invitation.event_type || 'Event'}
          </span>
          <h1 className="text-4xl font-bold mb-6 text-gray-800">{invitation.title}</h1>
          <p className="text-lg text-gray-600 mb-8 font-light italic">{invitation.host_names}</p>
          
          <div className="flex flex-col gap-4 items-center text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              {invitation.event_address}
            </div>
          </div>

          <button 
            onClick={handleSaveDate}
            className="mt-8 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-all inline-flex items-center gap-2 shadow-lg"
          >
            <Clock className="w-4 h-4" /> {t.save_date}
          </button>
        </div>

        {/* SECTION PROGRAMME ANIMÉ (Timeline) */}
        <div className="my-20">
            <ProgramSection program={invitation.event_program || []} />
        </div>

        {/* RSVP FORM */}
        {!submitted ? (
          <div className="bg-amber-50/50 p-8 rounded-[3rem] border border-amber-100 shadow-sm mt-20">
            <div className="mb-8 text-center">
              <Users className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-800">{t.confirm_rsvp}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-center gap-8 bg-white p-4 rounded-2xl shadow-inner">
                <button type="button" onClick={() => handleCountChange(count - 1)} className="text-2xl font-bold text-amber-400 w-10 h-10">-</button>
                <span className="text-3xl font-black text-gray-700">{count}</span>
                <button type="button" onClick={() => handleCountChange(count + 1)} className="text-2xl font-bold text-amber-400 w-10 h-10">+</button>
              </div>

              <div className="space-y-4">
                {guests.map((guest, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 space-y-3">
                    <p className="text-[9px] font-black uppercase text-gray-300 text-left">{t.guest_number} {i + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder={t.first_name} 
                        required
                        className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm"
                        value={guest.prenom}
                        onChange={(e) => {
                           const n = [...guests];
                           n[i].prenom = e.target.value;
                           setGuests(n);
                        }}
                      />
                      <input 
                        placeholder={t.last_name} 
                        required
                        className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm"
                        value={guest.nom}
                        onChange={(e) => {
                           const n = [...guests];
                           n[i].nom = e.target.value;
                           setGuests(n);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-amber-400 to-rose-400 text-white rounded-[2rem] font-bold shadow-lg hover:shadow-amber-200 transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : t.send}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-green-100 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.thank_you}</h3>
            <p className="text-gray-400 italic">{t.success_msg}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}