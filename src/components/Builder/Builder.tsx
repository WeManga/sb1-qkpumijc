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
  // Déblocage permanent du Mode personnalisé (logo/couleur perso sur le volet
  // d'ouverture), acquis en achetant le pack de 10 invitations. Indépendant de
  // l'expiration du Premium, comme c'était déjà le cas fonctionnellement avant.
  has_custom_branding?: boolean;
};

// --- Brouillon local (localStorage) ---
// Évite de perdre les saisies en cours si l'appli est déchargée de la mémoire
// quand l'utilisateur bascule sur une autre appli, puis revient dessus.
const DRAFT_STORAGE_PREFIX = 'invite_builder_draft_';

const getDraftStorageKey = (id?: string) => `${DRAFT_STORAGE_PREFIX}${id || 'new'}`;

const saveDraftToStorage = (id: string | undefined, data: BuilderInvitation) => {
  try {
    window.localStorage.setItem(
      getDraftStorageKey(id),
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch (error) {
    console.error('Erreur sauvegarde brouillon local:', error);
  }
};

const readDraftFromStorage = (id: string | undefined): BuilderInvitation | null => {
  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(id));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch (error) {
    console.error('Erreur lecture brouillon local:', error);
    return null;
  }
};

const clearDraftFromStorage = (id: string | undefined) => {
  try {
    window.localStorage.removeItem(getDraftStorageKey(id));
  } catch (error) {
    console.error('Erreur suppression brouillon local:', error);
  }
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
  const [accountHasCustomBranding, setAccountHasCustomBranding] = useState<boolean>(false);

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
    has_custom_branding: false
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

    clearDraftFromStorage(invitationId);
    onBack();
  };

  // Lit le plan réellement actif de l'utilisateur (profiles.plan_type +
  // has_custom_branding), en tenant compte de l'expiration du Premium.
  // - isPremium (plan_type === 'PREMIUM') détermine l'accès aux fonctionnalités
  //   Premium classiques (templates, textures, messages personnalisés...), et
  //   expire 1 mois après le dernier achat (voir apply_invitation_purchase côté SQL).
  // - has_custom_branding détermine l'accès au Mode personnalisé : un
  //   déblocage PERMANENT acquis via le pack de 10 invitations, qui ne dépend
  //   pas de l'expiration du Premium (jamais remis à false automatiquement).
  const getEffectivePlan = async (): Promise<{
    planType: 'FREE' | 'PREMIUM';
    hasCustomBranding: boolean;
  }> => {
    if (!user) return { planType: 'FREE', hasCustomBranding: false };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, has_custom_branding, premium_expires_at')
        .eq('id', user.id)
        .single();

      if (error || !data) return { planType: 'FREE', hasCustomBranding: false };

      const profile: any = data;
      const expiresAt = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
      const isPremiumActive = profile.plan_type === 'PREMIUM' && expiresAt && expiresAt > new Date();
      const hasCustomBranding = !!profile.has_custom_branding;

      if (isPremiumActive) {
        return { planType: 'PREMIUM', hasCustomBranding };
      }

      if (profile.plan_type === 'PREMIUM' && expiresAt && expiresAt <= new Date()) {
        await supabase
          .from('profiles')
          .update({
            plan_type: 'FREE',
            premium_expires_at: null
          } as any)
          .eq('id', user.id);
      }

      return { planType: 'FREE', hasCustomBranding };
    } catch (error) {
      console.error('Erreur lecture profil:', error);
      return { planType: 'FREE', hasCustomBranding: false };
    }
  };

  const initialiseBuilder = async () => {
    setLoading(true);

    const { planType: effectivePlanType, hasCustomBranding: effectiveHasCustomBranding } = await getEffectivePlan();
    setAccountPlanType(effectivePlanType);
    setAccountHasCustomBranding(effectiveHasCustomBranding);

    if (invitationId) {
      await loadInvitation(effectivePlanType, effectiveHasCustomBranding);
    } else {
      const localDraft = readDraftFromStorage(undefined);

      setInvitation((current) => ({
        ...current,
        ...(localDraft || {}),
        plan_type: effectivePlanType,
        has_custom_branding: effectiveHasCustomBranding
      }));
      setLoading(false);
    }
  };

  const loadInvitation = async (
    effectivePlanType: 'FREE' | 'PREMIUM',
    effectiveHasCustomBranding: boolean
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
        const localDraft = readDraftFromStorage(invitationId);

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
          // Le brouillon local (saisies pas encore enregistrées) prime sur ce qui vient du serveur.
          ...(localDraft || {}),
          plan_type: effectivePlanType,
          has_custom_branding: effectiveHasCustomBranding
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

  // Toute modification passe par ici : elle met à jour l'état ET le brouillon local,
  // pour ne rien perdre si l'appli est déchargée pendant que l'utilisateur fait autre chose.
  const handleInvitationChange = (next: BuilderInvitation) => {
    setInvitation(next);
    saveDraftToStorage(invitationId, next);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { planType: effectivePlanType, hasCustomBranding: effectiveHasCustomBranding } = await getEffectivePlan();
      setAccountPlanType(effectivePlanType);
      setAccountHasCustomBranding(effectiveHasCustomBranding);

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
        // Mode personnalisé : préférence conservée même si l'accès venait à
        // changer, pour ne pas perdre les réglages (logo/couleur) déjà saisis.
        custom_branding_enabled: invitation.custom_branding_enabled || false,
        custom_branding_color: invitation.custom_branding_color || '#FFFFFF',
        custom_logo_url: invitation.custom_logo_url || '',
        plan_type: effectivePlanType,
        has_custom_branding: effectiveHasCustomBranding,
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
        has_custom_branding: effectiveHasCustomBranding
      }));

      clearDraftFromStorage(invitationId);

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
        has_custom_branding: accountHasCustomBranding
      }}
      onInvitationChange={handleInvitationChange}
      onSave={handleSave}
      onBack={handleBackRequest}
      saving={saving}
    />
  );
}
