import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import MobileApp from './MobileApp';
import { Loader2 } from 'lucide-react';
import { translations, Language } from '../../lib/i18n';

type Invitation = Database['public']['Tables']['invitations']['Row'];

interface BuilderProps {
  invitationId?: string;
  onBack: () => void;
}

export function Builder({ invitationId, onBack }: BuilderProps) {
  const { user } = useAuth();

  const lang = (localStorage.getItem('invite_lang') as Language) || 'fr';
  const tAuth = translations[lang].auth;

  const [invitation, setInvitation] = useState<Partial<Invitation>>({
    event_type: 'wedding',
    title: translations[lang].builder.theme_wedding,
    host_names: 'John & Jane',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    event_address: '',
    event_program: [],
    envelope_color: '#FEE2E2',
    paper_type: 'smooth',
    paper_color: '#FFFFFF',
    background_color: '#FFFFFF',
    background_theme: '',
    premium_trigger_type: 'emoji',
    font_style: 'Inter, sans-serif',
    photo_pos_x: 50,
    photo_pos_y: 50,
    is_published: false,
    language: lang,
    opening_type: 'vinyl',
    container_open: 'envelope',
    opening_category: 'wedding',
    opening_theme: 'wedding_just_married',
    opening_video_url: '',
    opening_poster_url: '',
    photo_url_2: '',
    photo_url_3: '',
    // @ts-ignore
    plan_type: 'PREMIUM'
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

      if (invData) {
        setInvitation({
          ...invData,
          paper_type: invData.paper_type || 'smooth',
          paper_color: invData.paper_color || '#FFFFFF',
          background_color: invData.background_color || '#FFFFFF',
          background_theme: invData.background_theme || '',
          premium_trigger_type: invData.premium_trigger_type || 'emoji',
          opening_type: invData.opening_type || 'vinyl',
          container_open: invData.container_open || 'envelope',
          opening_category: invData.opening_category || 'wedding',
          opening_theme: invData.opening_theme || 'wedding_just_married',
          opening_video_url: invData.opening_video_url || '',
          opening_poster_url: invData.opening_poster_url || '',
          photo_url_2: invData.photo_url_2 || '',
          photo_url_3: invData.photo_url_3 || '',
          // À retirer quand les vrais plans FREE/PREMIUM seront branchés.
          // @ts-ignore
          plan_type: 'PREMIUM'
        });
      }
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
        paper_type: invitation.paper_type || 'smooth',
        paper_color: invitation.paper_color || '#FFFFFF',
        background_color: invitation.background_color || '#FFFFFF',
        background_theme: invitation.background_theme || '',
        premium_trigger_type: invitation.premium_trigger_type || 'emoji',
        opening_type: invitation.opening_type || 'vinyl',
        container_open: invitation.container_open || 'envelope',
        opening_category: invitation.opening_category || 'wedding',
        opening_theme: invitation.opening_theme || 'wedding_just_married',
        opening_video_url: invitation.opening_video_url || '',
        opening_poster_url: invitation.opening_poster_url || '',
        photo_url_2: invitation.photo_url_2 || '',
        photo_url_3: invitation.photo_url_3 || '',
        updated_at: new Date().toISOString()
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

      const successMsg =
        lang === 'fr'
          ? 'Votre invitation est enregistrée'
          : lang === 'en'
            ? 'Your invitation has been saved'
            : 'Lời mời của bạn đã được lưu';

      alert(successMsg);
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
