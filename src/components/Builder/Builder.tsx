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
  // 'business' donne accès au Mode personnalisé (logo/couleur perso sur le volet d'ouverture).
  plan_package?: 'solo' | 'multi' | 'business' | null;
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
  const [accountPlanPackage, setAccountPlanPackage] = useState<'solo' | 'multi' | 'business' | null>(null);

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
    custom_branding_enabled: false,
    custom_branding_color: '#FFFFFF',
    custom_logo_url: '',
    plan_type: 'FREE',
    plan_package: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initialiseBuilder();
  }, [invitationId, user]);

  const getBackConfirmMessage = () => {
    if (lang === 'en') {
      return 'Are you sure you want to go back without saving? Your latest changes may be lost.';
    }

    if (lang === 'vi') {
      return 'Bạn có chắc muốn quay lại mà chưa lưu không? Những thay đổi mới nhất có thể bị mất.';
    }

    return 'Êtes-vous sûr de vouloir revenir sans enregistrer ? Vos dernières modifications peuvent être perdues.';
  };

  const handleBackRequest = () => {
    const confirmed = window.confirm(getBackConfirmMessage());

    if (!confirmed) return;

    onBack();
  };

  // Lit le plan réellement actif de l'utilisateur (profiles.plan_type + plan_package),
  // en tenant compte de l'expiration. C'est ce couple qui détermine :
  // - isPremium (plan_type === 'PREMIUM')
  // - isBusiness (plan_package === 'business'), utilisé pour le Mode personnalisé
  const getEffectivePlan = async (): Promise<{
    planType: 'FREE' | 'PREMIUM';
    planPackage: 'solo' | 'multi' | 'business' | null;
  }> => {
    if (!user) return { planType: 'FREE', planPackage: null };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, plan_package, premium_expires_at')
        .eq('id', user.id)
        .single();

      if (error || !data) return { planType: 'FREE', planPackage: null };

      const profile: any = data;
      const expiresAt = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
      const isPremiumActive = profile.plan_type === 'PREMIUM' && expiresAt && expiresAt > new Date();

      if (isPremiumActive) {
        return { planType: 'PREMIUM', planPackage: profile.plan_package || null };
      }

      if (profile.plan_type === 'PREMIUM' && expiresAt && expiresAt <= new Date()) {
        await supabase
          .from('profiles')
          .update({
            plan_type: 'FREE',
            plan_package: null,
            premium_duration_months: null,
            premium_expires_at: null
          } as any)
          .eq('id', user.id);
      }

      return { planType: 'FREE', planPackage: null };
    } catch (error) {
      console.error('Erreur lecture profil:', error);
      return { planType: 'FREE', planPackage: null };
    }
  };

  const initialiseBuilder = async () => {
    setLoading(true);

    const { planType: effectivePlanType, planPackage: effectivePlanPackage } = await getEffectivePlan();
    setAccountPlanType(effectivePlanType);
    setAccountPlanPackage(effectivePlanPackage);

    if (invitationId) {
      await loadInvitation(effectivePlanType, effectivePlanPackage);
    } else {
      setInvitation((current) => ({
        ...current,
        plan_type: effectivePlanType,
        plan_package: effectivePlanPackage
      }));
      setLoading(false);
    }
  };

  const loadInvitation = async (
    effectivePlanType: 'FREE' | 'PREMIUM',
    effectivePlanPackage: 'solo' | 'multi' | 'business' | null
  ) => {
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
          custom_branding_enabled: invData.custom_branding_enabled || false,
          custom_branding_color: invData.custom_branding_color || '#FFFFFF',
          custom_logo_url: invData.custom_logo_url || '',
          plan_type: effectivePlanType,
          plan_package: effectivePlanPackage
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
      const { planType: effectivePlanType, planPackage: effectivePlanPackage } = await getEffectivePlan();
      setAccountPlanType(effectivePlanType);
      setAccountPlanPackage(effectivePlanPackage);

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
        // Mode personnalisé : seul un compte Business peut réellement l'activer,
        // mais la préférence est conservée pour ne pas perdre les réglages si le pack expire.
        custom_branding_enabled: invitation.custom_branding_enabled || false,
        custom_branding_color: invitation.custom_branding_color || '#FFFFFF',
        custom_logo_url: invitation.custom_logo_url || '',
        plan_type: effectivePlanType,
        plan_package: effectivePlanPackage,
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
        plan_type: effectivePlanType,
        plan_package: effectivePlanPackage
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
        plan_type: accountPlanType,
        plan_package: accountPlanPackage
      }}
      onInvitationChange={setInvitation}
      onSave={handleSave}
      onBack={handleBackRequest}
      saving={saving}
    />
  );
}
