import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Check } from 'lucide-react';

interface RSVPFormProps {
  invitationId: string;
}

export function RSVPForm({ invitationId }: RSVPFormProps) {
  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    attending: true,
    numberOfGuests: 1,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('rsvp_responses')
        .insert([{
          invitation_id: invitationId,
          guest_name: formData.guestName,
          email: formData.email,
          phone: formData.phone,
          attending: formData.attending,
          number_of_guests: formData.numberOfGuests,
          message: formData.message,
        }]);

      if (!error) {
        setSubmitted(true);
      } else {
        alert("Erreur lors de l'envoi : " + error.message);
      }
    } catch (err) {
      console.error('RSVP Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="bg-green-50 border-2 border-green-200 rounded-[2.5rem] p-10 text-center animate-in zoom-in duration-500">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
        <Check size={32} />
      </div>
      <h3 className="text-xl font-bold text-green-800 mb-2 uppercase tracking-widest">Merci !</h3>
      <p className="text-green-600 font-medium">Votre réponse a bien été enregistrée.</p>
    </div>
  );

  return (
    <div ref={sectionRef} className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/20">
        <p className="text-center text-gray-400 text-xs uppercase tracking-[0.3em] mb-8">Confirmation de présence</p>
        
        <input
          type="text"
          placeholder="Votre Nom"
          value={formData.guestName}
          onChange={e => setFormData({...formData, guestName: e.target.value})}
          required
          className="w-full px-5 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-400 outline-none transition-all"
        />

        <div className="grid grid-cols-2 gap-4">
          <select
            value={formData.attending ? 'yes' : 'no'}
            onChange={e => setFormData({...formData, attending: e.target.value === 'yes'})}
            className="px-4 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-400 outline-none bg-white"
          >
            <option value="yes">Je viens !</option>
            <option value="no">Absent(e)</option>
          </select>

          <select
            value={formData.numberOfGuests}
            onChange={e => setFormData({...formData, numberOfGuests: parseInt(e.target.value)})}
            className="px-4 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-400 outline-none bg-white"
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Personne{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>

        <textarea
          placeholder="Un petit message ? (Optionnel)"
          value={formData.message}
          onChange={e => setFormData({...formData, message: e.target.value})}
          rows={3}
          className="w-full px-5 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-400 outline-none resize-none"
        />

        <button
          type="submit"
          disabled={isSubmitting || !formData.guestName}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Envoi...' : <><Send size={16} /> Envoyer</>}
        </button>
      </form>
    </div>
  );
}