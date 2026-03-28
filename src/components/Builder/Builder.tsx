import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import MobileApp from './MobileApp';
import { Loader2 } from 'lucide-react';

type Invitation = Database['public']['Tables']['invitations']['Row'];

interface BuilderProps {
  invitationId?: string;
  onBack: () => void;
}

export function Builder({ invitationId, onBack }: BuilderProps) {
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<Partial<Invitation>>({
    event_type: 'wedding',
    title: 'Notre Mariage',
    host_names: 'John & Jane',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    event_address: '',
    event_program: [],
    envelope_color: '#b45309',
    is_published: false,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invitationId) {
      loadInvitation();
    } else {
      setLoading(false);
    }
  }, [invitationId]);

  const loadInvitation = async () => {
    if (!invitationId) return;
    try {
      const { data: invData } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .maybeSingle();

      if (invData) setInvitation(invData);

      const { data: photosData } = await supabase
        .from('invitation_photos')
        .select('*')
        .eq('invitation_id', invitationId)
        .order('position');

      if (photosData) setPhotos(photosData.map(p => p.photo_url));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let currentId = invitationId;
      if (!currentId) {
        const { data, error } = await supabase
          .from('invitations')
          .insert({
            ...invitation,
            user_id: user.id,
            slug: generateSlug(),
          })
          .select().single();
        if (error) throw error;
        currentId = data.id;
      } else {
        const { error } = await supabase
          .from('invitations')
          .update({ ...invitation, updated_at: new Date().toISOString() })
          .eq('id', currentId);
        if (error) throw error;
      }
      alert('Enregistré avec succès !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // ON RENVOIE LE MOBILE APP AU LIEU DE L'ANCIENNE STRUCTURE
  return (
    <MobileApp 
      invitation={invitation} 
      onInvitationChange={setInvitation}
      onSave={handleSave}
      onBack={onBack}
      saving={saving}
    />
  );
}