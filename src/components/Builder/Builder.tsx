import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import MobileApp from './MobileApp';
import { Loader2 } from 'lucide-react';
import { translations, Language } from '../../lib/i18n';

type Invitation = Database['public']['Tables']['invitations']['Row'];
type BuilderInvitation = Partial<Invitation> & {
  plan_type?: 'FREE' | 'PREMIUM';
};

interface BuilderProps {
  invitationId?: string;
  onBack: () => void;
}

export function Builder({ invitationId, onBack }: BuilderProps) {
  const { user } = useAuth();

  const lang = (localStorage.getItem('invite_lang') as Language) || 'fr';
  const tAuth = translations[lang].auth;

  const [accountPlanType, setAccountPlanType] = useState<'FREE' | 'PREMIUM'>('FREE');

  const [invitation, setInvitation] = useState<BuilderInvitation>({
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
    album_photo_url_1: '',
    album_photo_url_2: '',
    album_photo_url_3: '',
    album_photo_url_4: '',
    album_photo_url_5: '',
    album_photo_url_6: '',
    plan_type: 'FREE'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initialiseBuilder();
  }, [invitationId, user]);

  const getEffectivePlanType = async (): Promise<'FREE' | 'PREMIUM'> => {
    if (!user) return 'FREE';

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, premium_expires_at')
        .eq('id', user.id)
        .single();

      if (error || !data) return 'FREE';

      const profile: any = data;
      const expiresAt = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
      const isPremiumActive = profile.plan_type === 'PREMIUM' && expiresAt && expiresAt > new Date();

      if (isPremiumActive) {
        return 'PREMIUM';
      }

      if (profile.plan_type === 'PREMIUM' && expiresAt && expiresAt <= new Date()) {
        await supabase
          .from('profiles')
          .update({
            plan_type: 'FREE',
            premium_duration_months: null,
            premium_expires_at: null
          } as any)
          .eq('id', user.id);
      }

      return 'FREE';
    } catch (error) {
      console.error('Erreur lecture profil:', error);
      return 'FREE';
    }
  };

  const initialiseBuilder = async () => {
    setLoading(true);

    const effectivePlanType = await getEffectivePlanType();
    setAccountPlanType(effectivePlanType);

    if (invitationId) {
      await loadInvitation(effectivePlanType);
    } else {
      setInvitation((current) => ({
        ...current,
        plan_type: effectivePlanType
      }));
      setLoading(false);
    }
  };

  const loadInvitation = async (effectivePlanType: 'FREE' | 'PREMIUM') => {
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
          album_photo_url_1: invData.album_photo_url_1 || '',
          album_photo_url_2: invData.album_photo_url_2 || '',
          album_photo_url_3: invData.album_photo_url_3 || '',
          album_photo_url_4: invData.album_photo_url_4 || '',
          album_photo_url_5: invData.album_photo_url_5 || '',
          album_photo_url_6: invData.album_photo_url_6 || '',
          plan_type: effectivePlanType
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
      const effectivePlanType = await getEffectivePlanType();
      setAccountPlanType(effectivePlanType);

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
        album_photo_url_1: invitation.album_photo_url_1 || '',
        album_photo_url_2: invitation.album_photo_url_2 || '',
        album_photo_url_3: invitation.album_photo_url_3 || '',
        album_photo_url_4: invitation.album_photo_url_4 || '',
        album_photo_url_5: invitation.album_photo_url_5 || '',
        album_photo_url_6: invitation.album_photo_url_6 || '',
        plan_type: effectivePlanType,
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

      setInvitation((current) => ({
        ...current,
        plan_type: effectivePlanType
      }));

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
      invitation={{
        ...invitation,
        plan_type: accountPlanType
      }}
      onInvitationChange={setInvitation}
      onSave={handleSave}
      onBack={onBack}
      saving={saving}
    />
  );
}
