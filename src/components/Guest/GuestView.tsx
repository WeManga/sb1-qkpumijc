import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // CHEMIN CORRIGÉ
import { translations, Language } from '../../lib/i18n'; // CHEMIN CORRIGÉ
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Loader2, 
  MapPin, 
  Clock,
  Sparkles
} from 'lucide-react';

interface GuestViewProps {
  invitation: any;
}

export function GuestView({ invitation }: GuestViewProps) {
  const [lang, setLang] = useState<Language>('fr');
  
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'fr', 'vi'].includes(browserLang)) {
      setLang(browserLang);
    }
  }, []);

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
    const newGuests = [...guests];
    if (val > guests.length) {
      for (let i = guests.length; i < val; i++) {
        newGuests.push({ nom: '', prenom: '', age: '' });
      }
    } else {
      newGuests.splice(val);
    }
    setGuests(newGuests);
  };

  const updateGuest = (index: number, field: string, value: string) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <div className="h-[60vh] relative overflow-hidden">
        {invitation.main_photo_url ? (
          <img src={invitation.main_photo_url} className="w-full h-full object-cover" alt="Event" />
        ) : (
          <div className="w-full h-full bg-amber-50 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-amber-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-32 relative z-10 text-center">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-xl border border-white mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4 block">
            {invitation.event_type || 'Event'}
          </span>
          <h1 className="text-4xl font-bold mb-6 text-gray-800">{invitation.title}</h1>
          
          <div className="flex flex-col gap-4 items-center text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {invitation.event_address}
            </div>
          </div>

          <button 
            onClick={handleSaveDate}
            className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-colors inline-flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> {t.save_date}
          </button>
        </div>

        {!submitted ? (
          <div className="bg-amber-50/50 p-8 rounded-[3rem] border border-amber-100 shadow-sm">
            <div className="mb-8">
              <Users className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-800">{t.confirm_rsvp}</h2>
              <p className="text-gray-400 text-[11px] uppercase tracking-widest mt-1 font-bold">{t.how_many}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-center gap-8 bg-white p-4 rounded-2xl shadow-inner">
                <button type="button" onClick={() => handleCountChange(count - 1)} className="text-2xl font-bold text-amber-400 w-10 h-10">-</button>
                <span className="text-3xl font-black text-gray-700">{count}</span>
                <button type="button" onClick={() => handleCountChange(count + 1)} className="text-2xl font-bold text-amber-400 w-10 h-10">+</button>
              </div>

              <div className="space-y-4">
                {guests.map((guest, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 space-y-3 animate-in slide-in-from-bottom-2">
                    <p className="text-[9px] font-black uppercase text-gray-300 text-left">{t.guest_number}{i + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder={t.first_name} 
                        required
                        className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm"
                        value={guest.prenom}
                        onChange={(e) => updateGuest(i, 'prenom', e.target.value)}
                      />
                      <input 
                        placeholder={t.last_name} 
                        required
                        className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm"
                        value={guest.nom}
                        onChange={(e) => updateGuest(i, 'nom', e.target.value)}
                      />
                    </div>
                    <input 
                      type="number" 
                      placeholder={t.age} 
                      required
                      className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm"
                      value={guest.age}
                      onChange={(e) => updateGuest(i, 'age', e.target.value)}
                    />
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
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-green-100 text-center animate-in zoom-in">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.thank_you}</h3>
            <p className="text-gray-400 italic">{t.success_msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}