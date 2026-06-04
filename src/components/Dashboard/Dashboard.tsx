import { useState, useEffect, type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { translations as allTranslations, Language } from '../../lib/i18n';
import {
  Plus,
  Eye,
  CreditCard as Edit,
  LogOut,
  Trash2,
  Copy,
  Loader2,
  Users,
  X,
  Share,
  User,
  ShieldCheck,
  Ticket,
  QrCode,
  CreditCard,
  ArrowLeft,
  MoreVertical,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BRAND_FONT_LINK_ID = 'invit-studio-brand-font';

type AppChannel = 'web' | 'android_apk' | 'android_play';

const APP_CHANNEL = ((import.meta as any).env?.VITE_APP_CHANNEL || 'web') as AppChannel;
const ZALO_PHONE_NUMBER = '';
const ZALO_LOGO_SRC = '/public/images/logo%20zalo.png';

const isAndroidPlayChannel = APP_CHANNEL === 'android_play';
const canUseExternalPayments = APP_CHANNEL === 'web' || APP_CHANNEL === 'android_apk';

const brandTitleStyle: CSSProperties = {
  fontFamily: '"Great Vibes", cursive',
  fontWeight: 400,
  letterSpacing: '0',
  color: '#c7a068',
  textShadow:
    '0 1px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(92,62,28,0.28), 0 10px 22px rgba(0,0,0,0.16)'
};

const isAndroidDevice = () => /Android/i.test(navigator.userAgent);
const isIOSDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandaloneApp = () =>
  window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

const getInitialZaloPosition = () => {
  if (typeof window === 'undefined') return { x: 24, y: 520 };

  const savedPosition = localStorage.getItem('zalo_button_position');

  if (savedPosition) {
    try {
      const parsed = JSON.parse(savedPosition) as { x: number; y: number };
      return {
        x: Math.min(Math.max(12, parsed.x), window.innerWidth - 76),
        y: Math.min(Math.max(12, parsed.y), window.innerHeight - 76)
      };
    } catch {
      return { x: window.innerWidth - 88, y: window.innerHeight - 96 };
    }
  }

  return { x: window.innerWidth - 88, y: window.innerHeight - 96 };
};

const translations: any = {
  ...allTranslations,
  en: {
    ...allTranslations.en,
    pwa: {
      title: 'Install Studio App',
      desc: 'Manage invitations easily. Tap',
      then: 'then',
      action: 'Add to Home Screen'
    },
    account: {
      title: 'My Account',
      manage: 'Manage My Account',
      placeholder: 'Enter activation code',
      activate: 'Activate',
      status: 'Account Status',
      duration: 'Subscription duration:'
    },
    plans: {
      title: 'Upgrade to PREMIUM',
      subtitle: 'Unlock all templates, personalized messages, paper textures, photo albums and many more features.',
      month: 'month',
      months: 'months',
      popular: 'Most Popular',
      best: 'Best Value',
      save: 'Save',
      current: '/mo',
      buy: 'Select'
    },
    checkout: {
      title: 'Select Payment Method',
      subtitle: 'Choose your payment method to activate PREMIUM automatically.',
      qr: 'Pay by QR Code',
      cb: 'Pay by Credit Card'
    }
  },
  fr: {
    ...allTranslations.fr,
    pwa: {
      title: "Installez l'App Studio",
      desc: 'Gérez vos invitations facilement. Appuyez sur',
      then: 'puis sur',
      action: "Sur l'écran d'accueil"
    },
    account: {
      title: 'Mon Compte',
      manage: 'Gérer Mon Compte',
      placeholder: 'Entrez votre code unique',
      activate: 'Activer',
      status: 'Statut du compte',
      duration: "Durée de l'abonnement :"
    },
    plans: {
      title: 'Passez au PREMIUM',
      subtitle: "Accédez à toute l'expérience Invit Studio : designs exclusifs, messages personnalisés, albums enrichis et finitions haut de gamme.",
      month: 'mois',
      months: 'mois',
      popular: 'Le plus populaire',
      best: 'Meilleure offre',
      save: 'Économisez',
      current: '/mois',
      buy: 'Sélectionner'
    },
    checkout: {
      title: 'Choisir le moyen de paiement',
      subtitle: 'Sélectionnez votre mode de règlement pour activer PREMIUM automatiquement.',
      qr: 'Payer par QR Code',
      cb: 'Payer par CB'
    }
  },
  vi: {
    ...allTranslations.vi,
    pwa: {
      title: 'Cài đặt App Studio',
      desc: 'Quản lý lời mời dễ dàng hơn. Nhấn vào',
      then: 'sau đó chọn',
      action: 'Thêm vào màn hình chính'
    },
    account: {
      title: 'Tài khoản của tôi',
      manage: 'Quản lý tài khoản',
      placeholder: 'Nhập mã kích hoạt',
      activate: 'Kích hoạt',
      status: 'Trạng thái tài khoản',
      duration: 'Thời hạn gói:'
    },
    plans: {
      title: 'Nâng cấp lên PREMIUM',
      subtitle: 'Mở khóa toàn bộ giao diện, tin nhắn cá nhân, chất liệu giấy, album ảnh và nhiều tính năng khác.',
      month: 'tháng',
      months: 'tháng',
      popular: 'Phổ biến',
      best: 'Tiết kiệm nhất',
      save: 'Tiết kiệm',
      current: '/tháng',
      buy: 'Chọn'
    },
    checkout: {
      title: 'Chọn phương thức thanh toán',
      subtitle: 'Chọn cách thanh toán để tự động kích hoạt PREMIUM.',
      qr: 'Thanh toán qua mã QR',
      cb: 'Thanh toán thẻ ngân hàng'
    }
  }
};

type Invitation = Database['public']['Tables']['invitations']['Row'] & {
  response_count?: number;
};

interface GuestResponse {
  group_leader_name: string;
  total_guests: number;
  guest_details: any;
}

interface DashboardProps {
  onCreateNew: () => void;
  onEdit: (invitationId: string) => void;
}

export function Dashboard({ onCreateNew, onEdit }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponses, setSelectedResponses] = useState<GuestResponse[] | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountStep, setAccountStep] = useState<'PROFILE' | 'PLANS' | 'CHECKOUT'>('PROFILE');

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [premiumDuration, setPremiumDuration] = useState<string>('');
  const [activationCode, setActivationCode] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [sepayPayment, setSepayPayment] = useState<any>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const [zaloPosition, setZaloPosition] = useState(getInitialZaloPosition);
  const [zaloDragOffset, setZaloDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingZalo, setIsDraggingZalo] = useState(false);
  const [zaloWasDragged, setZaloWasDragged] = useState(false);

  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('invite_lang') as Language) || 'en'
  );

  useEffect(() => {
    if (!document.getElementById(BRAND_FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = BRAND_FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
    loadAccountStatus();

    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenAccount = urlParams.get('openAccount') === 'true';
    const shouldOpenPlans = urlParams.get('openPlans') === 'true';

    if (shouldOpenAccount || (shouldOpenPlans && !canUseExternalPayments)) {
      setAccountStep('PROFILE');
      setIsAccountOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (shouldOpenPlans && canUseExternalPayments) {
      setAccountStep('PLANS');
      setIsAccountOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (isIOSDevice() && !isStandaloneApp() && !localStorage.getItem('pwa_prompt_dismissed')) {
      setShowIOSPrompt(true);
    }

    if (
      APP_CHANNEL === 'web' &&
      isAndroidDevice() &&
      !isStandaloneApp() &&
      !localStorage.getItem('android_pwa_prompt_dismissed')
    ) {
      setShowAndroidPrompt(true);
    }

    const handleStorageChange = () => {
      const savedLang = localStorage.getItem('invite_lang') as Language;
      if (savedLang) setLang(savedLang);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('zalo_button_position', JSON.stringify(zaloPosition));
  }, [zaloPosition]);

  useEffect(() => {
    if (!isDraggingZalo) return;

    const handlePointerMove = (event: PointerEvent) => {
      const nextX = Math.min(
        Math.max(12, event.clientX - zaloDragOffset.x),
        window.innerWidth - 76
      );

      const nextY = Math.min(
        Math.max(12, event.clientY - zaloDragOffset.y),
        window.innerHeight - 76
      );

      setZaloWasDragged(true);
      setZaloPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDraggingZalo(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingZalo, zaloDragOffset]);

  const t = translations[lang].dashboard;
  const tAuth = translations[lang].sidebar;
  const tPwa = translations[lang].pwa;
  const tAcc = translations[lang].account;
  const tPln = translations[lang].plans || translations.en.plans;
  const tChk = translations[lang].checkout || translations.en.checkout;

  const privacyLabel =
    lang === 'fr'
      ? 'Politique de confidentialité'
      : lang === 'vi'
        ? 'Chính sách quyền riêng tư'
        : 'Privacy Policy';

  const androidPwaCopy = {
    en: {
      title: 'Install Invit Studio',
      desc: 'Keep the app on your home screen for faster access.',
      step1: 'Tap',
      menu: 'the menu',
      step2: 'then choose',
      action: 'Add to Home screen',
      step3: 'Confirm installation'
    },
    fr: {
      title: 'Installez Invit Studio',
      desc: "Gardez l'app sur votre écran d'accueil pour y accéder plus vite.",
      step1: 'Appuyez sur',
      menu: 'le menu',
      step2: 'puis choisissez',
      action: "Ajouter à l'écran d'accueil",
      step3: "Validez l'installation"
    },
    vi: {
      title: 'Cài đặt Invit Studio',
      desc: 'Giữ ứng dụng trên màn hình chính để mở nhanh hơn.',
      step1: 'Nhấn vào',
      menu: 'menu',
      step2: 'rồi chọn',
      action: 'Thêm vào màn hình chính',
      step3: 'Xác nhận cài đặt'
    }
  }[lang] || {
    title: 'Install Invit Studio',
    desc: 'Keep the app on your home screen for faster access.',
    step1: 'Tap',
    menu: 'the menu',
    step2: 'then choose',
    action: 'Add to Home screen',
    step3: 'Confirm installation'
  };

  const dismissIOSPrompt = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowIOSPrompt(false);
  };

  const dismissAndroidPrompt = () => {
    localStorage.setItem('android_pwa_prompt_dismissed', 'true');
    setShowAndroidPrompt(false);
  };

  const getFunctionErrorMessage = async (error: any) => {
    let message = error?.message || 'Erreur inconnue';

    const context = error?.context;
    if (context) {
      const errorBody = await context.json().catch(() => null);
      message = errorBody?.error || message;
    }

    return message;
  };

  const getDurationLabel = (months?: number, days?: number) => {
    if (days && days > 0) {
      if (lang === 'fr') return `${days} jour${days > 1 ? 's' : ''}`;
      if (lang === 'vi') return `${days} ngày`;
      return `${days} day${days > 1 ? 's' : ''}`;
    }

    const safeMonths = months || 0;

    if (lang === 'fr') return `${safeMonths} mois`;
    if (lang === 'vi') return `${safeMonths} tháng`;
    return `${safeMonths} month${safeMonths > 1 ? 's' : ''}`;
  };

  const loadAccountStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, premium_duration_months, premium_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        const profile: any = data;
        const expiresAt = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
        const isPremiumActive = profile.plan_type === 'PREMIUM' && expiresAt && expiresAt > new Date();

        if (isPremiumActive) {
          setAccountStatus('PREMIUM');

          if (profile.premium_duration_months) {
            setPremiumDuration(getDurationLabel(profile.premium_duration_months, 0));
          } else {
            setPremiumDuration(
              lang === 'fr'
                ? `Jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}`
                : lang === 'vi'
                  ? `Đến ${expiresAt.toLocaleDateString('vi-VN')}`
                  : `Until ${expiresAt.toLocaleDateString('en-US')}`
            );
          }
        } else {
          setAccountStatus('FREE');
          setPremiumDuration('');

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
        }
      } else {
        setAccountStatus('FREE');
        setPremiumDuration('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvitations = async () => {
    if (!user) return;

    try {
      const { data: invs, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      const invsWithCounts = await Promise.all((invs || []).map(async (inv) => {
        const { count } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('invitation_id', inv.id);

        return { ...inv, response_count: count || 0 };
      }));

      setInvitations(invsWithCounts);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (invitationId: string) => {
    const { data, error = null } = await supabase
      .from('responses')
      .select('group_leader_name, total_guests, guest_details')
      .eq('invitation_id', invitationId);

    if (!error && data) {
      setSelectedResponses(data);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.delete + ' ?')) return;

    try {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) throw error;
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(url);
    alert(t.share);
  };

  const handleCopyResponsesList = () => {
    if (!selectedResponses || selectedResponses.length === 0) return;

    let textList = '';

    if (lang === 'fr') textList += 'LISTE DES INVITES CONFIRMES\n\n';
    else if (lang === 'vi') textList += 'DANH SACH KHACH MOI XAC NHAN\n\n';
    else textList += 'CONFIRMED GUEST LIST\n\n';

    selectedResponses.forEach((resp, index) => {
      textList += `${index + 1}. ${resp.group_leader_name} (${resp.total_guests} ${t.person_unit})\n`;

      if (Array.isArray(resp.guest_details) && resp.guest_details.length > 0) {
        resp.guest_details.forEach((guest: any) => {
          if (guest.firstName || guest.lastName) {
            textList += `   - ${guest.firstName || ''} ${guest.lastName || ''}\n`;
          }
        });
      }

      textList += '\n';
    });

    navigator.clipboard.writeText(textList.trim());

    const alertMsg =
      lang === 'fr'
        ? 'Liste copiée dans le presse-papiers !'
        : lang === 'vi'
          ? 'Đã sao chép danh sách!'
          : 'List copied to clipboard!';

    alert(alertMsg);
  };

  const handleActivateCode = async (e: FormEvent) => {
    e.preventDefault();

    if (!activationCode.trim() || !user) return;

    setActivationLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('activate-code', {
        body: { code: activationCode.trim() }
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error));
      }

      if (!data?.ok) throw new Error(data?.error || 'Code invalide');

      setAccountStatus('PREMIUM');
      setPremiumDuration(getDurationLabel(data.plan_months, data.plan_days));
      setActivationCode('');

      alert(
        lang === 'fr'
          ? 'Code activé ! Votre compte est maintenant PREMIUM.'
          : lang === 'vi'
            ? 'Đã kích hoạt mã! Tài khoản của bạn hiện là PREMIUM.'
            : 'Code activated! Your account is now PREMIUM.'
      );

      await loadAccountStatus();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setActivationLoading(false);
    }
  };

  const handleManageAccountClick = (e: ReactMouseEvent) => {
    e.preventDefault();

    if (!canUseExternalPayments || isAndroidPlayChannel) {
      setAccountStep('PROFILE');
      return;
    }

    setAccountStep('PLANS');
  };

  const handleZaloClick = () => {
    if (!ZALO_PHONE_NUMBER.trim()) {
      alert(
        lang === 'fr'
          ? 'Zalo sera bientôt disponible.'
          : lang === 'vi'
            ? 'Zalo sẽ sớm khả dụng.'
            : 'Zalo will be available soon.'
      );
      return;
    }

    window.open(`https://zalo.me/${ZALO_PHONE_NUMBER.trim()}`, '_blank');
  };

  const resetCheckout = () => {
    setCheckoutLoading(false);
    setCheckoutError('');
    setSepayPayment(null);
    setPaymentConfirmed(false);
    setGeneratedReceipt(null);
  };

  const handleSelectPlan = (plan: any) => {
    if (!canUseExternalPayments) {
      setAccountStep('PROFILE');
      return;
    }

    setSelectedPlan(plan);
    resetCheckout();
    setAccountStep('CHECKOUT');
  };

  const handleBackButton = async () => {
    if (accountStep === 'CHECKOUT' && paymentConfirmed) {
      await loadAccountStatus();
      resetCheckout();
      setAccountStep('PROFILE');
      return;
    }

    setAccountStep(accountStep === 'CHECKOUT' ? 'PLANS' : 'PROFILE');
  };

  const returnToAccount = async () => {
    await loadAccountStatus();
    resetCheckout();
    setAccountStep('PROFILE');
  };

  const handleCreateSepayCheckout = async (forcedPlanId?: string) => {
    if (!canUseExternalPayments) return;

    const planId = forcedPlanId || selectedPlan?.id;

    if (!planId) return;

    setCheckoutLoading(true);
    setCheckoutError('');
    setSepayPayment(null);
    setPaymentConfirmed(false);
    setGeneratedReceipt(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-sepay-checkout', {
        body: { plan_id: planId }
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error));
      }

      if (!data?.ok) throw new Error(data?.error || 'Impossible de créer le paiement');

      setSepayPayment(data.payment);
    } catch (err: any) {
      setCheckoutError(err.message || 'Erreur de paiement');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!sepayPayment?.id && !sepayPayment?.provider_reference) return;

    setCheckoutError('');

    try {
      const { data, error } = await supabase.functions.invoke('get-payment-status', {
        body: {
          payment_id: sepayPayment?.id,
          provider_reference: sepayPayment?.provider_reference
        }
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error));
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'Impossible de vérifier le paiement');
      }

      setSepayPayment(data.payment);

      if (data.payment?.status === 'paid') {
        setPaymentConfirmed(true);
        setGeneratedReceipt(data.receipt || null);
        await loadAccountStatus();
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Erreur de vérification du paiement');
    }
  };

  useEffect(() => {
    if (!isAccountOpen || accountStep !== 'CHECKOUT' || !sepayPayment?.id || sepayPayment.status === 'paid' || paymentConfirmed) {
      return;
    }

    const timer = setInterval(() => {
      checkPaymentStatus();
    }, 3500);

    return () => clearInterval(timer);
  }, [isAccountOpen, accountStep, sepayPayment?.id, sepayPayment?.status, paymentConfirmed]);

  const paymentPlans = [
    {
      id: '1_month',
      duration: `1 ${tPln.month}`,
      totalPrice: lang === 'vi' ? '199.000 VND' : lang === 'fr' ? '6,67 €' : '$7.55',
      monthlyPrice: lang === 'vi' ? '199.000 VND' : lang === 'fr' ? '6,67 €' : '$7.55',
      discount: null,
      tag: null
    },
    {
      id: '3_months',
      duration: `3 ${tPln.months}`,
      totalPrice: lang === 'vi' ? '522.000 VND' : lang === 'fr' ? '17,00 €' : '$19.81',
      monthlyPrice: lang === 'vi' ? '174.000 VND' : lang === 'fr' ? '5,67 €' : '$6.60',
      discount: '-12.56%',
      tag: tPln.popular || 'Popular'
    },
    {
      id: '6_months',
      duration: `6 ${tPln.months}`,
      totalPrice: lang === 'vi' ? '894.000 VND' : lang === 'fr' ? '29,12 €' : '$33.92',
      monthlyPrice: lang === 'vi' ? '149.000 VND' : lang === 'fr' ? '4,85 €' : '$5.65',
      discount: '-25.13%',
      tag: tPln.best || 'Best Value'
    }
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-gray-50 to-white scrollbar-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-0 pb-32">
        <div className="relative flex items-center justify-center border-b border-gray-100 mb-8 pt-8 pb-4">
          <div className="absolute left-0 -ml-14">
            <img
              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png"
              alt="Logo Invit Studio"
              className="h-24 w-auto object-contain"
            />
          </div>

          <h1 className="text-[2.65rem] sm:text-[3.15rem] leading-none whitespace-nowrap" style={brandTitleStyle}>
            Invit Studio
          </h1>

          <div className="absolute right-0 flex items-center gap-2">
            <button
              onClick={() => {
                setAccountStep('PROFILE');
                setIsAccountOpen(true);
                loadAccountStatus();
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-amber-500 transition-colors text-[10px] sm:text-[11px] font-bold uppercase tracking-widest px-2 py-2 border-r border-gray-100 pr-4"
            >
              <User className="w-4 h-4" />
              <span className="hidden xs:inline">{tAcc.title}</span>
            </button>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-gray-400 hover:text-rose-500 transition-colors text-[10px] sm:text-[11px] font-bold uppercase tracking-widest px-2 py-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">{tAuth.logout}</span>
            </button>
          </div>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
            <button
              onClick={onCreateNew}
              className="min-h-[250px] sm:min-h-[300px] bg-white rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-100 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center group-hover:bg-amber-400 group-hover:text-white transition-all shadow-sm">
                <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                {t.new_creation}
              </span>
            </button>

            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="h-40 sm:h-44 relative bg-gray-50 overflow-hidden">
                  {invitation.main_photo_url ? (
                    <img src={invitation.main_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 font-bold text-[10px] uppercase tracking-widest">
                      {t.preview}
                    </div>
                  )}

                  <button
                    onClick={() => fetchResponses(invitation.id)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-amber-400 hover:text-white transition-all group"
                  >
                    <Users className="w-4 h-4 text-amber-500 group-hover:text-white" />
                    <span className="text-[10px] font-black">{invitation.response_count || 0}</span>
                  </button>
                </div>

                <div className="p-6 sm:p-8 flex flex-col flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate mb-2">
                    {invitation.title}
                  </h3>

                  <div className="mt-auto space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => onEdit(invitation.id)}
                        className="col-span-2 py-3 bg-gray-900 text-white rounded-2xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Edit className="w-3 h-3" />
                        {t.edit}
                      </button>

                      <button
                        onClick={() => window.open(`/invite/${invitation.id}`, '_blank')}
                        className="py-3 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 border border-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(invitation.id)}
                        className="py-3 bg-rose-50 text-rose-300 rounded-2xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 border border-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopyLink(invitation.id)}
                      className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 border border-amber-100"
                    >
                      <Copy className="w-3 h-3" />
                      {t.share}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onPointerDown={(event) => {
            setIsDraggingZalo(true);
            setZaloWasDragged(false);
            setZaloDragOffset({
              x: event.clientX - zaloPosition.x,
              y: event.clientY - zaloPosition.y
            });
          }}
          onClick={() => {
            if (zaloWasDragged) return;
            handleZaloClick();
          }}
          style={{
            left: `${zaloPosition.x}px`,
            top: `${zaloPosition.y}px`,
            touchAction: 'none'
          }}
          className="fixed z-[420] w-16 h-16 p-0 bg-transparent border-none rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
          aria-label="Zalo"
        >
          <img
            src={ZALO_LOGO_SRC}
            alt="Zalo"
            draggable={false}
            className="w-16 h-16 object-contain select-none pointer-events-none drop-shadow-2xl"
          />
        </button>

        <AnimatePresence>
          {isAccountOpen && (
            <div className="fixed inset-0 z-[150] flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setIsAccountOpen(false)}
              />

              <div className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] border-t border-gray-100 overflow-hidden">
                <div className="w-full flex justify-center py-3 shrink-0 bg-gray-50/30">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="px-8 pb-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30 shrink-0">
                  <div className="flex items-center gap-3">
                    {accountStep !== 'PROFILE' && (
                      <button
                        type="button"
                        onClick={handleBackButton}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-gray-200/50 bg-white shadow-xs"
                      >
                        <ArrowLeft size={16} />
                      </button>
                    )}

                    <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                        {accountStep === 'PROFILE' && tAcc.title}
                        {accountStep === 'PLANS' && canUseExternalPayments && tPln.title}
                        {accountStep === 'CHECKOUT' && canUseExternalPayments && tChk.title}
                      </h3>

                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                        {accountStep === 'PROFILE' && user?.email}
                        {accountStep === 'PLANS' && canUseExternalPayments && tPln.subtitle}
                        {accountStep === 'CHECKOUT' && canUseExternalPayments && `${selectedPlan?.duration} - ${selectedPlan?.totalPrice}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAccountOpen(false)}
                    className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 pb-12">
                  {accountStep === 'PROFILE' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                            {tAcc.status}
                          </p>

                          <p className={`text-xl font-black ${accountStatus === 'PREMIUM' ? 'text-amber-500' : 'text-gray-500'}`}>
                            {accountStatus}
                          </p>

                          {accountStatus === 'PREMIUM' && premiumDuration && (
                            <p className="text-[10px] text-gray-400 font-bold mt-1">
                              {tAcc.duration} <span className="text-gray-700 font-black">{premiumDuration}</span>
                            </p>
                          )}
                        </div>

                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-white">
                          <ShieldCheck className={`w-6 h-6 ${accountStatus === 'PREMIUM' ? 'text-amber-500' : 'text-gray-300'}`} />
                        </div>
                      </div>

                      {canUseExternalPayments && (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleManageAccountClick}
                            className="text-xs font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest underline decoration-2 underline-offset-4"
                          >
                            {tAcc.manage}
                          </button>
                        </div>
                      )}

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountOpen(false);
                            window.location.href = '/privacy-policy';
                          }}
                          className="text-[10px] font-black text-gray-400 hover:text-amber-600 uppercase tracking-widest underline decoration-1 underline-offset-4"
                        >
                          {privacyLabel}
                        </button>
                      </div>

                      {!canUseExternalPayments && (
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-snug">
                            {lang === 'fr'
                              ? 'Les codes promo restent disponibles depuis cette version.'
                              : lang === 'vi'
                                ? 'Mã khuyến mãi vẫn có thể sử dụng trong phiên bản này.'
                                : 'Promo codes remain available in this version.'}
                          </p>
                        </div>
                      )}

                      <div className="border-t border-gray-100 pt-6 space-y-3">
                        <form onSubmit={handleActivateCode} className="space-y-3">
                          <div className="relative">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />

                            <input
                              type="text"
                              required
                              value={activationCode}
                              onChange={(e) => setActivationCode(e.target.value)}
                              placeholder={tAcc.placeholder}
                              className="w-full bg-gray-50 border-none h-12 pl-12 pr-4 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-300 outline-none transition-all"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={activationLoading || !activationCode.trim()}
                            className="w-full h-12 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-gray-800 active:scale-98 disabled:opacity-40 flex items-center justify-center"
                          >
                            {activationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tAcc.activate}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {accountStep === 'PLANS' && canUseExternalPayments && (
                    <div className="space-y-4">
                      {paymentPlans.map((plan, idx) => (
                        <div
                          key={idx}
                          className={`bg-white rounded-2xl p-5 border flex items-center justify-between relative transition-all duration-300 ${
                            plan.tag ? 'border-amber-400 shadow-md bg-gradient-to-r from-amber-50/10 via-white to-white' : 'border-gray-100 shadow-sm'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                {plan.duration}
                              </h4>

                              {plan.discount && (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black">
                                  {plan.discount}
                                </span>
                              )}

                              {plan.tag && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black">
                                  {plan.tag}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              Total: <span className="text-gray-700 font-black">{plan.totalPrice}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-base font-black text-gray-900 tracking-tight">
                                {plan.monthlyPrice}
                                <span className="text-[10px] text-gray-400 font-normal">{tPln.current}</span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectPlan(plan)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                plan.tag ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {tPln.buy || 'Sélectionner'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {accountStep === 'CHECKOUT' && canUseExternalPayments && (
                    <div className="space-y-5">
                      {checkoutError && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold">
                          {checkoutError}
                        </div>
                      )}

                      {!sepayPayment && !paymentConfirmed && (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => handleCreateSepayCheckout()}
                            disabled={checkoutLoading}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-4 transition-all hover:bg-amber-50/40 hover:border-amber-300 group text-left disabled:opacity-60"
                          >
                            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-700 group-hover:text-amber-500 group-hover:shadow-md transition-all">
                              {checkoutLoading ? <Loader2 size={20} className="animate-spin" /> : <QrCode size={20} />}
                            </div>

                            <div>
                              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                {tChk.qr}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                VietQR
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                lang === 'fr'
                                  ? 'Le paiement par carte bancaire sera bientôt disponible.'
                                  : lang === 'vi'
                                    ? 'Thanh toán bằng thẻ ngân hàng sẽ sớm khả dụng.'
                                    : 'Card payment will be available soon.'
                              )
                            }
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-4 transition-all hover:bg-amber-50/40 hover:border-amber-300 group text-left"
                          >
                            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-700 group-hover:text-amber-500 group-hover:shadow-md transition-all">
                              <CreditCard size={20} />
                            </div>

                            <div>
                              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                {tChk.cb}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {lang === 'fr' ? 'Bientôt' : lang === 'vi' ? 'Sắp ra mắt' : 'Coming soon'}
                              </p>
                            </div>
                          </button>
                        </div>
                      )}

                      {sepayPayment && !paymentConfirmed && (
                        <div className="space-y-5 text-center">
                          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
                            <img
                              src={sepayPayment.qr_code_url}
                              alt="QR Code VietQR"
                              className="w-full max-w-[260px] mx-auto rounded-2xl"
                            />
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
                              {lang === 'fr' ? 'Montant à payer' : lang === 'vi' ? 'Số tiền cần thanh toán' : 'Amount to pay'}
                            </p>
                            <p className="text-2xl font-black text-gray-900">
                              {Number(sepayPayment.amount).toLocaleString('vi-VN')} VND
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest break-all">
                              {sepayPayment.provider_reference}
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-widest">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {lang === 'fr' ? 'En attente du paiement' : lang === 'vi' ? 'Đang chờ thanh toán' : 'Waiting for payment'}
                          </div>

                          <button
                            type="button"
                            onClick={checkPaymentStatus}
                            className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                          >
                            {lang === 'fr' ? 'Vérifier maintenant' : lang === 'vi' ? 'Kiểm tra ngay' : 'Check now'}
                          </button>
                        </div>
                      )}

                      {paymentConfirmed && (
                        <div className="space-y-5 text-center">
                          <div className="py-4">
                            <ShieldCheck className="w-14 h-14 text-amber-500 mx-auto mb-3" />
                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                              {lang === 'fr' ? 'Compte PREMIUM activé' : lang === 'vi' ? 'Tài khoản PREMIUM đã kích hoạt' : 'PREMIUM account activated'}
                            </h4>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                              {lang === 'fr' ? 'Paiement confirmé avec succès' : lang === 'vi' ? 'Thanh toán đã được xác nhận' : 'Payment confirmed successfully'}
                            </p>
                          </div>

                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                            <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-2">
                              {lang === 'fr' ? 'Votre accès Premium est maintenant disponible' : lang === 'vi' ? 'Quyền truy cập Premium hiện đã sẵn sàng' : 'Your Premium access is now available'}
                            </p>
                            <p className="text-sm font-bold text-gray-700 leading-snug">
                              {lang === 'fr'
                                ? 'Vous pouvez utiliser les modèles, messages personnalisés, textures de papier et autres fonctionnalités Premium.'
                                : lang === 'vi'
                                  ? 'Bạn có thể sử dụng giao diện, tin nhắn cá nhân, chất liệu giấy và các tính năng Premium khác.'
                                  : 'You can now use templates, personalized messages, paper textures and other Premium features.'}
                            </p>
                          </div>

                          {generatedReceipt?.receipt_number && (
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              {generatedReceipt.receipt_number}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={returnToAccount}
                            className="w-full h-12 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                          >
                            {lang === 'fr' ? 'Voir mon compte' : lang === 'vi' ? 'Xem tài khoản' : 'View my account'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {isViewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    {t.responses_title}
                  </h3>

                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                    {t.responses_subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedResponses && selectedResponses.length > 0 && (
                    <button
                      onClick={handleCopyResponsesList}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      <Copy size={12} />
                      {lang === 'fr' ? 'Copier la liste' : lang === 'vi' ? 'Sao chép danh sách' : 'Copy list'}
                    </button>
                  )}

                  <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                    <X />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {selectedResponses?.length === 0 ? (
                  <p className="text-center py-10 text-gray-400 font-medium">
                    {t.no_responses}
                  </p>
                ) : (
                  selectedResponses?.map((resp, i) => (
                    <div key={i} className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{resp.group_leader_name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                            {resp.total_guests} {t.person_unit}
                          </p>
                        </div>

                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Users className="w-4 h-4 text-amber-500" />
                        </div>
                      </div>

                      {Array.isArray(resp.guest_details) && resp.guest_details.length > 0 && (
                        <div className="mt-1 pt-2 border-t border-gray-200/60 space-y-1">
                          {resp.guest_details.map((g: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-600 font-medium pl-1 flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-gray-400 rounded-full" />
                              {g.firstName || ''} {g.lastName || ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showIOSPrompt && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-10 left-4 right-4 z-[500] bg-white/95 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-6 border border-amber-100"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <Plus size={28} />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    {tPwa.title}
                  </h3>

                  <p className="text-[11px] text-gray-500 leading-snug mt-1 flex items-center flex-wrap">
                    {tPwa.desc}
                    <Share size={14} className="inline mx-1 text-blue-500" />
                    {tPwa.then}
                    <span className="flex items-center gap-1 ml-1 font-bold text-gray-800">
                      <Plus size={14} className="text-blue-500" /> "{tPwa.action}"
                    </span>.
                  </p>
                </div>

                <button onClick={dismissIOSPrompt} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAndroidPrompt && (
            <motion.div
              initial={{ y: 110, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 110, opacity: 0 }}
              className="fixed bottom-10 left-4 right-4 z-[500] bg-white/95 backdrop-blur-xl shadow-2xl rounded-[2rem] p-5 border border-blue-100"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0068ff] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <Home size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    {androidPwaCopy.title}
                  </h3>

                  <p className="text-[11px] text-gray-500 leading-snug mt-1">
                    {androidPwaCopy.desc}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                      <div className="w-9 h-9 rounded-xl bg-white shadow-sm mx-auto flex items-center justify-center text-gray-700">
                        <MoreVertical size={18} />
                      </div>
                      <p className="text-[9px] text-gray-500 font-black uppercase mt-2 leading-tight">
                        {androidPwaCopy.step1} {androidPwaCopy.menu}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                      <div className="w-9 h-9 rounded-xl bg-white shadow-sm mx-auto flex items-center justify-center text-blue-600">
                        <Plus size={18} />
                      </div>
                      <p className="text-[9px] text-gray-500 font-black uppercase mt-2 leading-tight">
                        {androidPwaCopy.step2} {androidPwaCopy.action}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                      <div className="w-9 h-9 rounded-xl bg-white shadow-sm mx-auto flex items-center justify-center text-amber-600">
                        <Home size={18} />
                      </div>
                      <p className="text-[9px] text-gray-500 font-black uppercase mt-2 leading-tight">
                        {androidPwaCopy.step3}
                      </p>
                    </div>
                  </div>
                </div>

                <button onClick={dismissAndroidPrompt} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 shrink-0">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 relative z-10">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}
      </div>
    </div>
  );
}
