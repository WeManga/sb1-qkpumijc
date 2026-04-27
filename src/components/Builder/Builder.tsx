import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import MobileApp from './MobileApp';
import { Loader2, Lock } from 'lucide-react'; // Lock ajouté pour l'UI future
import { translations, Language } from '../../lib/i18n';
import { PREMIUM_COLORS } from '../../constants/colors';

type Invitation = Database['public']['Tables']['invitations']['Row'];



interface BuilderProps {
  invitationId?: string;
  onBack: () => void;
}

export function Builder({ invitationId, onBack }: BuilderProps) {
  const { user } = useAuth();
  
  const lang = (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].builder;
  const tAuth = translations[lang].auth;

  const [invitation, setInvitation] = useState<Partial<Invitation>>({
    event_type: 'wedding',
    title: lang === 'vi' ? 'Đám cưới của chúng tôi' : lang === 'en' ? 'Our Wedding' : 'Notre Mariage',
    host_names: 'John & Jane',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    event_address: '',
    event_program: [],
    envelope_color: '#FEE2E2',
    font_style: 'Inter, sans-serif',
    photo_pos_x: 50,
    photo_pos_y: 50,
    is_published: false,
    language: lang,
    // @ts-ignore - On prévoit la colonne plan_type ajoutée en SQL
    plan_type: 'FREE' 
  });

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
      const { data: invData, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .maybeSingle();

      if (error) throw error;
      if (invData) setInvitation(invData);
    } catch (error) {
      console.error('Erreur chargement:', error);
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
      const payload = {
        ...invitation,
        user_id: user.id,
        photo_pos_x: parseInt(String(invitation.photo_pos_x || 50)),
        photo_pos_y: parseInt(String(invitation.photo_pos_y || 50)),
        language: localStorage.getItem('invite_lang') || invitation.language || 'fr',
        updated_at: new Date().toISOString(),
      };

      if (!invitationId) {
        const { error } = await supabase
          .from('invitations')
          .insert([{ ...payload, slug: generateSlug() }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('invitations')
          .update(payload)
          .eq('id', invitationId);
        if (error) throw error;
      }
      
      alert(lang === 'vi' ? 'Đã lưu thành công!' : lang === 'en' ? 'Saved successfully!' : 'Enregistré avec succès !');
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      alert(`${tAuth.error_default}: ${error.message || ''}`);
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