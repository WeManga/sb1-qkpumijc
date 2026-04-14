import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Check } from 'lucide-react';

interface RSVPFormProps {
  invitationId: string;
}

export function RSVPForm({ invitationId }: RSVPFormProps) {
  const [formData, setFormData] = useState({
    guestName: '',
    numberOfGuests: 1,
    message: '', // Note : ta table actuelle n'a pas de colonne message, on le stockera dans guest_details si besoin
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // On adapte les données au schéma : group_leader_name, guest_details, total_guests
      const { error } = await supabase
        .from('responses') // Changé de 'rsvp_responses' à 'responses'
        .insert([{
          invitation_id: invitationId,
          group_leader_name: formData.guestName,
          total_guests: formData.numberOfGuests,
          guest_details: [{ 
            name: formData.guestName, 
            note: formData.message 
          }] // On stocke les infos ici car ta table est en JSONB
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
          className="w-full px-5 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-amber-400 outline-none transition-all"
        />

        <div className="grid grid-cols-1 gap-4">
          <select
            value={formData.numberOfGuests}
            onChange={e => setFormData({...formData, numberOfGuests: parseInt(e.target.value)})}
            className="px-4 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-amber-400 outline-none bg-white"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>{n} Personne{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <textarea
          placeholder="Un petit message ? (Optionnel)"
          value={formData.message}
          onChange={e => setFormData({...formData, message: e.target.value})}
          rows={3}
          className="w-full px-5 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
        />

        <button
          type="submit"
          disabled={isSubmitting || !formData.guestName}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Envoi...' : <><Send size={16} /> Envoyer</>}
        </button>
      </form>
    </div>
  );
}