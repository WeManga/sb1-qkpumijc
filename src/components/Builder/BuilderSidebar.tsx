import { useState, useRef, useEffect, type WheelEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import {
  Heart,
  PartyPopper,
  Sparkles,
  Baby,
  MapPin,
  Music,
  Image as ImageIcon,
  Calendar,
  Plus,
  X,
  Move,
  Skull,
  Milk,
  Lock,
  Disc,
  Film,
  ChevronDown
} from 'lucide-react';
import { PREMIUM_COLORS } from '../../constants/colors';
import {
  OPENING_CATEGORIES,
  OPENING_THEMES,
  DEFAULT_THEME_BY_CATEGORY,
  DEFAULT_CATEGORY_BY_EVENT
} from '../../constants/openingThemes';

const COLOR_PALETTES = [
  { color: '#FEE2E2' },
  { color: '#E0F2FE' },
  { color: '#DCFCE7' },
  { color: '#FEF3C7' },
  { color: '#EF4444' },
  { color: '#1E3A8A' },
  { color: '#F5F5DC' },
  { color: '#7C3AED' },
  { color: '#374151' },
  { color: '#000000' },
  { color: '#FFFFFF' },
  { color: '#FFD700' },
  { color: '#FF69B4' },
  { color: '#8B4513' }
];

const PAPER_COLOR_PALETTES = [
  { color: '#FFFFFF' },
  { color: '#FFF8F0' },
  { color: '#F8EFE2' },
  { color: '#F5E6D3' },
  { color: '#F2ECE4' },
  { color: '#EEF3F0' },
  { color: '#F6EEF2' },
  { color: '#EFEAF6' },
  { color: '#F7F3E8' },
  { color: '#EDF2F7' }
];

const PREMIUM_PALETTES = [
  { id: 'satin_gold', name: 'Satin Gold', gradient: PREMIUM_COLORS.satin_gold },
  { id: 'satin_silver', name: 'Satin Silver', gradient: PREMIUM_COLORS.satin_silver },
  { id: 'chrome_rose', name: 'Chrome Rose', gradient: PREMIUM_COLORS.chrome_rose },
  { id: 'chrome_black', name: 'Chrome Black', gradient: PREMIUM_COLORS.chrome_black },
  { id: 'chrome_blue', name: 'Chrome Blue', gradient: PREMIUM_COLORS.chrome_blue }
];

const FONTS = [
  { id: 'font-sans', name: 'Moderne Pur', family: 'ui-sans-serif, system-ui, sans-serif', premium: false },
  { id: 'font-serif', name: 'Classique Chic', family: "'Playfair Display', serif", premium: false },
  { id: 'font-elegant', name: 'Élégance Riviera', family: "'Cinzel', serif", premium: true },
  { id: 'font-script', name: 'Plume Douce', family: "'Great Vibes', cursive", premium: true },
  { id: 'font-royal', name: 'Royal Majesty', family: "'Monsieur La Doulaise', cursive", premium: true },
  { id: 'font-vintage', name: 'Héritage Ancien', family: "'Cinzel Decorative', serif", premium: true },
  { id: 'font-boho', name: 'Bohème Spirit', family: "'Caveat', cursive", premium: true },
  { id: 'font-luxury', name: 'Luxe Minimal', family: "'Bodoni Moda', serif", premium: true }
];

const TEXTURES = [
  { id: 'smooth', name: 'Smooth', premium: false },
  { id: 'parchment', name: 'Parchment', premium: true },
  { id: 'grainy', name: 'Grainy', premium: true },
  { id: 'cotton', name: 'Cotton', premium: true },
  { id: 'silk', name: 'Silk', premium: true },
  { id: 'velvet', name: 'Velvet', premium: true }
];

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*';

const compressImageFile = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;

  const maxWidth = 1400;
  const maxHeight = 1400;
  const quality = 0.75;
  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imageUrl;
    });

    let { width, height } = img;

    if (width <= maxWidth && height <= maxHeight && file.size <= 500 * 1024) {
      return file;
    }

    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    if (!blob) return file;

    const originalName = file.name.replace(/\.[^/.]+$/, '');

    return new File([blob], `${originalName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

export function BuilderSidebar({ invitation, onInvitationChange, activeTab }: any) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhotoKey, setSelectedPhotoKey] = useState('main_photo_url');
  const [paperMode, setPaperMode] = useState<'color' | 'texture'>('texture');
  const [triggerMode, setTriggerMode] = useState<'emoji' | 'decor'>(invitation.premium_trigger_type || 'emoji');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    info: true,
    program: true,
    premiumStory: false,
    mainMedia: true,
    adjustMedia: false,
    opening: true,
    look: true,
    ambiance: true,
    fonts: false
  });

  const dragRef = useRef<{ x: number; y: number; isDragging: boolean; lastDist: number }>({
    x: 0,
    y: 0,
    isDragging: false,
    lastDist: 0
  });

  useEffect(() => {
    setTriggerMode(invitation.premium_trigger_type || 'emoji');
  }, [invitation.premium_trigger_type]);

  const lang = (invitation.language as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].builder;
  const isPremium = invitation.plan_type === 'PREMIUM';

  const openingMode = isPremium && invitation.container_open === 'video' ? 'video' : 'envelope';

  const selectedOpeningCategory =
    invitation.opening_category ||
    OPENING_THEMES.find(theme => theme.id === invitation.opening_theme)?.category ||
    DEFAULT_CATEGORY_BY_EVENT[invitation.event_type] ||
    DEFAULT_CATEGORY_BY_EVENT.default;

  const availableOpeningThemes = OPENING_THEMES.filter(theme => theme.category === selectedOpeningCategory);

  const selectedOpeningTheme =
    invitation.opening_theme && availableOpeningThemes.some(theme => theme.id === invitation.opening_theme)
      ? invitation.opening_theme
      : DEFAULT_THEME_BY_CATEGORY[selectedOpeningCategory as keyof typeof DEFAULT_THEME_BY_CATEGORY] || DEFAULT_THEME_BY_CATEGORY.other;

  const localLabels = {
    fr: {
      info: 'Informations',
      program: 'Programme',
      media: 'Photos et musique',
      adjust: 'Cadrage des photos',
      opening: 'Ouverture',
      look: 'Papier et couleurs',
      fonts: 'Police',
      ambiance: 'Ambiance',
      premium_badge: 'Premium',
      opening_type_label: "Animation après l'ouverture",
      opening_mode_label: "Mode d'ouverture",
      opening_mode_panel: 'Volet',
      opening_mode_video: 'Vidéos',
      opening_category_label: 'Famille de vidéo',
      opening_theme_label: 'Thème vidéo',
      premium_colors: 'Couleurs premium',
      alert_msg: 'Vous possédez un compte FREE, veuillez passer en PREMIUM pour débloquer cette fonctionnalité.',
      paper_section_label: 'Carte',
      paper_mode_texture: 'Texture',
      paper_mode_color: 'Couleur',
      trigger_mode_emoji: 'Émojis',
      trigger_mode_decor: 'Décor',
      bg_color_label: 'Fond',
      bg_balloons: 'Ballons',
      bg_flowers: 'Fleurs',
      bg_butterflies: 'Papillons',
      bg_stars: 'Étoiles',
      filmstrip_photo_2: 'Pellicule 2',
      filmstrip_photo_3: 'Pellicule 3',
      premium_story_label: 'Sections premium',
      premium_mid_label: 'Après le programme',
      premium_final_label: 'Section finale',
      premium_title_placeholder: 'Titre de la section',
      premium_text_placeholder: 'Texte de la section...',
      premium_mid_title_placeholder: 'Ex : Notre histoire',
      premium_mid_text_placeholder: 'Ajoutez un texte spécial après le programme...',
      premium_final_title_placeholder: 'Ex : Un dernier mot',
      premium_final_text_placeholder: 'Ajoutez un message final avant la confirmation...',
      premium_photo: 'Photo de section',
      main_photo: "Photo d'ouverture",
      end_photo: 'Photo finale',
      music: 'Musique'
    },
    en: {
      info: 'Information',
      program: 'Program',
      media: 'Photos and music',
      adjust: 'Photo framing',
      opening: 'Opening',
      look: 'Paper and colors',
      fonts: 'Font',
      ambiance: 'Ambiance',
      premium_badge: 'Premium',
      opening_type_label: 'Animation after opening',
      opening_mode_label: 'Opening mode',
      opening_mode_panel: 'Panel',
      opening_mode_video: 'Videos',
      opening_category_label: 'Video family',
      opening_theme_label: 'Video theme',
      premium_colors: 'Premium colors',
      alert_msg: 'You have a FREE account, please upgrade to PREMIUM to unlock this feature.',
      paper_section_label: 'Card',
      paper_mode_texture: 'Texture',
      paper_mode_color: 'Color',
      trigger_mode_emoji: 'Emoji',
      trigger_mode_decor: 'Decor',
      bg_color_label: 'Background',
      bg_balloons: 'Balloons',
      bg_flowers: 'Flowers',
      bg_butterflies: 'Butterflies',
      bg_stars: 'Stars',
      filmstrip_photo_2: 'Filmstrip 2',
      filmstrip_photo_3: 'Filmstrip 3',
      premium_story_label: 'Premium sections',
      premium_mid_label: 'After program',
      premium_final_label: 'Final section',
      premium_title_placeholder: 'Section title',
      premium_text_placeholder: 'Section text...',
      premium_mid_title_placeholder: 'E.g. Our story',
      premium_mid_text_placeholder: 'Add a special text after the program...',
      premium_final_title_placeholder: 'E.g. A final note',
      premium_final_text_placeholder: 'Add a final message before RSVP...',
      premium_photo: 'Section photo',
      main_photo: 'Opening photo',
      end_photo: 'Final photo',
      music: 'Music'
    },
    vi: {
      info: 'Thông tin',
      program: 'Chương trình',
      media: 'Ảnh và nhạc',
      adjust: 'Căn chỉnh ảnh',
      opening: 'Mở thiệp',
      look: 'Giấy và màu',
      fonts: 'Phông chữ',
      ambiance: 'Không gian',
      premium_badge: 'Premium',
      opening_type_label: 'Hoạt ảnh sau khi mở',
      opening_mode_label: 'Kiểu mở',
      opening_mode_panel: 'Bảng',
      opening_mode_video: 'Video',
      opening_category_label: 'Nhóm video',
      opening_theme_label: 'Chủ đề video',
      premium_colors: 'Màu premium',
      alert_msg: 'Bạn đang sử dụng tài khoản MIỄN PHÍ, vui lòng nâng cấp lên PREMIUM để mở khóa tính năng này.',
      paper_section_label: 'Thẻ',
      paper_mode_texture: 'Kết cấu',
      paper_mode_color: 'Màu',
      trigger_mode_emoji: 'Emoji',
      trigger_mode_decor: 'Trang trí',
      bg_color_label: 'Nền',
      bg_balloons: 'Bóng bay',
      bg_flowers: 'Hoa',
      bg_butterflies: 'Bướm',
      bg_stars: 'Sao',
      filmstrip_photo_2: 'Ảnh phim 2',
      filmstrip_photo_3: 'Ảnh phim 3',
      premium_story_label: 'Mục premium',
      premium_mid_label: 'Sau chương trình',
      premium_final_label: 'Mục cuối',
      premium_title_placeholder: 'Tiêu đề mục',
      premium_text_placeholder: 'Nội dung mục...',
      premium_mid_title_placeholder: 'Ví dụ: Câu chuyện của chúng tôi',
      premium_mid_text_placeholder: 'Thêm nội dung đặc biệt sau chương trình...',
      premium_final_title_placeholder: 'Ví dụ: Lời cuối',
      premium_final_text_placeholder: 'Thêm lời nhắn cuối trước xác nhận...',
      premium_photo: 'Ảnh của mục',
      main_photo: 'Ảnh mở đầu',
      end_photo: 'Ảnh cuối',
      music: 'Nhạc'
    }
  }[lang];

  const filmstripPhoto2Label = (t as any).filmstrip_photo_2 || localLabels.filmstrip_photo_2;
  const filmstripPhoto3Label = (t as any).filmstrip_photo_3 || localLabels.filmstrip_photo_3;

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkPremiumAccess = (condition: boolean) => {
    if (!condition && !isPremium) {
      alert(localLabels.alert_msg);
      return false;
    }

    return true;
  };

  const handlePremiumClick = (colorValue: string) => {
    if (!checkPremiumAccess(false)) return;
    onInvitationChange({ ...invitation, envelope_color: colorValue });
  };

  const handlePaperColorClick = (colorValue: string) => {
    if (!checkPremiumAccess(false)) return;
    onInvitationChange({ ...invitation, paper_color: colorValue });
  };

  const handlePaperPremiumClick = (colorValue: string) => {
    if (!checkPremiumAccess(false)) return;
    onInvitationChange({ ...invitation, paper_color: colorValue });
  };

  const handleBackgroundPremiumClick = (colorValue: string) => {
    if (!checkPremiumAccess(false)) return;
    onInvitationChange({
      ...invitation,
      premium_trigger_type: 'decor',
      background_color: colorValue
    });
  };

  const handleTriggerModeSwitch = (mode: 'emoji' | 'decor') => {
    if (mode === 'decor' && !checkPremiumAccess(false)) return;

    setTriggerMode(mode);
    onInvitationChange({ ...invitation, premium_trigger_type: mode });
  };

  const handleBackgroundThemeClick = (themeId: string, premium: boolean) => {
    if (!checkPremiumAccess(!premium)) return;

    onInvitationChange({
      ...invitation,
      premium_trigger_type: 'decor',
      background_theme: themeId
    });
  };

  const handleOpeningTypeClick = (typeId: string, premium: boolean) => {
    if (!checkPremiumAccess(!premium)) return;
    onInvitationChange({ ...invitation, opening_type: typeId });
  };

  const handleOpeningModeClick = (mode: 'envelope' | 'video') => {
    if (mode === 'video' && !checkPremiumAccess(false)) return;

    if (mode === 'envelope') {
      onInvitationChange({
        ...invitation,
        container_open: 'envelope'
      });
      return;
    }

    const safeCategory =
      selectedOpeningCategory ||
      DEFAULT_CATEGORY_BY_EVENT[invitation.event_type] ||
      DEFAULT_CATEGORY_BY_EVENT.default;

    const defaultTheme =
      DEFAULT_THEME_BY_CATEGORY[safeCategory as keyof typeof DEFAULT_THEME_BY_CATEGORY] ||
      DEFAULT_THEME_BY_CATEGORY.other;

    onInvitationChange({
      ...invitation,
      container_open: 'video',
      opening_category: safeCategory,
      opening_theme: selectedOpeningTheme || defaultTheme
    });
  };

  const handleOpeningCategoryChange = (categoryId: string) => {
    if (!checkPremiumAccess(false)) return;

    const defaultTheme =
      DEFAULT_THEME_BY_CATEGORY[categoryId as keyof typeof DEFAULT_THEME_BY_CATEGORY] ||
      DEFAULT_THEME_BY_CATEGORY.other;

    onInvitationChange({
      ...invitation,
      opening_category: categoryId,
      opening_theme: defaultTheme,
      container_open: 'video'
    });
  };

  const handleOpeningThemeChange = (themeId: string) => {
    if (!checkPremiumAccess(false)) return;

    const theme = OPENING_THEMES.find(item => item.id === themeId);

    onInvitationChange({
      ...invitation,
      opening_category: theme?.category || selectedOpeningCategory,
      opening_theme: themeId,
      container_open: 'video'
    });
  };

  const handleThemeClick = (themeId: string, premium: boolean) => {
    if (!checkPremiumAccess(!premium)) return;

    const updates: any = { ...invitation, event_type: themeId };

    if (openingMode === 'video') {
      const nextCategory = DEFAULT_CATEGORY_BY_EVENT[themeId] || DEFAULT_CATEGORY_BY_EVENT.default;
      const nextTheme =
        DEFAULT_THEME_BY_CATEGORY[nextCategory as keyof typeof DEFAULT_THEME_BY_CATEGORY] ||
        DEFAULT_THEME_BY_CATEGORY.other;

      updates.opening_category = nextCategory;
      updates.opening_theme = nextTheme;
      updates.container_open = 'video';
    }

    onInvitationChange(updates);
  };

  const handleFontClick = (fontFamily: string, premium: boolean) => {
    if (!checkPremiumAccess(!premium)) return;
    onInvitationChange({ ...invitation, font_style: fontFamily });
  };

  const handleTextureClick = (textureId: string, premium: boolean) => {
    if (!checkPremiumAccess(!premium)) return;
    onInvitationChange({ ...invitation, paper_type: textureId });
  };

  const EVENT_TYPES = [
    { id: 'wedding', name: t.theme_wedding, icon: Heart, premium: false },
    { id: 'birthday', name: t.theme_birthday, icon: PartyPopper, premium: false },
    { id: 'party', name: t.theme_party, icon: Sparkles, premium: false },
    { id: 'baptism', name: t.theme_baptism, icon: Baby, premium: true },
    { id: 'babyshower', name: t.theme_babyshower, icon: Milk, premium: true },
    { id: 'funeral', name: t.theme_funeral, icon: Skull, premium: true }
  ];

  const uploadFile = async (e: any, field: string) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    if (originalFile.type.startsWith('image/') && originalFile.size > 20 * 1024 * 1024) {
      alert('Image trop lourde. Merci de choisir une image de moins de 20 Mo.');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const file = originalFile.type.startsWith('image/') ? await compressImageFile(originalFile) : originalFile;
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      const { error } = await supabase.storage.from('invitations').upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from('invitations').getPublicUrl(fileName);
      const updates: any = { ...invitation, [field]: data.publicUrl };

      if (
        field === 'main_photo_url' ||
        field === 'end_photo_url' ||
        field === 'photo_url_2' ||
        field === 'photo_url_3'
      ) {
        updates[`${field}_pos_x`] = 0;
        updates[`${field}_pos_y`] = 0;
        updates[`${field}_scale`] = 1;
      }

      onInvitationChange(updates);
    } catch {
      alert("Erreur d'upload");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const uploadProgramImage = async (e: any, index: number) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;
    if (!checkPremiumAccess(false)) return;

    if (originalFile.type.startsWith('image/') && originalFile.size > 20 * 1024 * 1024) {
      alert('Image trop lourde. Merci de choisir une image de moins de 20 Mo.');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const file = originalFile.type.startsWith('image/') ? await compressImageFile(originalFile) : originalFile;
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop();
      const fileName = `prog-${Date.now()}-${index}.${extension}`;

      const { error } = await supabase.storage.from('invitations').upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from('invitations').getPublicUrl(fileName);
      const newProgram = [...(invitation.event_program || [])];

      newProgram[index] = { ...newProgram[index], image_url: data.publicUrl };

      onInvitationChange({ ...invitation, event_program: newProgram });
    } catch {
      alert("Erreur d'upload");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addProgramStep = () => {
    const newProgram = [...(invitation.event_program || []), { time: '12:00', activity: '', image_url: '' }];
    onInvitationChange({ ...invitation, event_program: newProgram });
  };

  const updateProgramStep = (index: number, field: string, value: string) => {
    const newProgram = [...(invitation.event_program || [])];
    newProgram[index] = { ...newProgram[index], [field]: value };
    onInvitationChange({ ...invitation, event_program: newProgram });
  };

  const removeProgramStep = (index: number) => {
    const newProgram = (invitation.event_program || []).filter((_: any, i: number) => i !== index);
    onInvitationChange({ ...invitation, event_program: newProgram });
  };

  const handleDragMove = (e: any) => {
    if (!dragRef.current.isDragging) return;

    const posKeyX = `${selectedPhotoKey}_pos_x`;
    const posKeyY = `${selectedPhotoKey}_pos_y`;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (e.touches && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      if (dragRef.current.lastDist > 0) {
        const scaleKey = `${selectedPhotoKey}_scale`;
        const delta = (dist - dragRef.current.lastDist) * 0.01;

        onInvitationChange({
          ...invitation,
          [scaleKey]: Math.max(0.1, (invitation[scaleKey] || 1) + delta)
        });
      }

      dragRef.current.lastDist = dist;
      return;
    }

    const deltaX = clientX - dragRef.current.x;
    const deltaY = clientY - dragRef.current.y;

    onInvitationChange({
      ...invitation,
      [posKeyX]: (invitation[posKeyX] || 0) + deltaX,
      [posKeyY]: (invitation[posKeyY] || 0) + deltaY
    });

    dragRef.current.x = clientX;
    dragRef.current.y = clientY;
  };

  const handleWheel = (e: WheelEvent) => {
    const scaleKey = `${selectedPhotoKey}_scale`;
    const delta = e.deltaY * -0.001;

    onInvitationChange({
      ...invitation,
      [scaleKey]: Math.max(0.1, (invitation[scaleKey] || 1) + delta)
    });
  };

  const Section = ({ id, title, icon: Icon, premium, children }: any) => {
    const isOpen = openSections[id];

    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full h-14 px-4 flex items-center justify-between text-left"
        >
          <span className="flex items-center gap-3 min-w-0">
            {Icon && <Icon size={17} className="text-amber-500 shrink-0" />}
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-700 truncate">
              {title}
            </span>
            {premium && (
              <span className="shrink-0 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[8px] font-black uppercase">
                {localLabels.premium_badge}
              </span>
            )}
          </span>

          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && <div className="px-4 pb-4 space-y-4">{children}</div>}
      </div>
    );
  };

  const PremiumMark = ({ locked }: { locked: boolean }) => {
    if (!locked) return null;

    return (
      <span className="absolute right-2 top-2 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
        <Lock size={11} className="text-gray-500" />
      </span>
    );
  };

  const OptionButton = ({ active, premium, icon: Icon, label, onClick }: any) => {
    const locked = premium && !isPremium;

    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative min-h-12 rounded-xl border px-3 py-3 flex items-center gap-2 text-left transition-all ${
          active ? 'border-amber-400 bg-amber-50 text-gray-950 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600'
        } ${locked ? 'opacity-50 grayscale' : ''}`}
      >
        {Icon && <Icon size={16} className={active ? 'text-amber-500 shrink-0' : 'text-gray-400 shrink-0'} />}
        <span className="text-[10px] font-black uppercase leading-tight">{label}</span>
        <PremiumMark locked={locked} />
      </button>
    );
  };

  const Swatch = ({ value, selected, premium, gradient, onClick }: any) => {
    const locked = premium && !isPremium;

    return (
      <button
        type="button"
        onClick={onClick}
        style={gradient ? { background: value } : { backgroundColor: value }}
        className={`relative h-10 w-10 shrink-0 rounded-full border-4 transition-all ${
          selected ? 'border-amber-400 scale-110 shadow-md' : 'border-white shadow-sm'
        } ${locked ? 'opacity-45 grayscale' : ''}`}
      >
        <PremiumMark locked={locked} />
      </button>
    );
  };

  const UploadBox = ({ label, value, premium, onChange }: any) => {
    const locked = premium && !isPremium;

    return (
      <label
        className={`relative flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-2xl border border-dashed border-gray-200 cursor-pointer overflow-hidden ${
          locked ? 'opacity-50 grayscale pointer-events-none' : ''
        }`}
      >
        {value ? (
          <img src={value} className="w-full h-full object-cover opacity-35" />
        ) : (
          <ImageIcon className="text-gray-400 mb-2" />
        )}

        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[10px] font-black text-gray-600 uppercase bg-white/45 text-center px-2">
          {label}
          {locked && <Lock size={15} />}
        </span>

        <input type="file" className="hidden" accept={IMAGE_ACCEPT} onChange={onChange} />
      </label>
    );
  };

  return (
    <div className="w-full space-y-4 pb-10">
      {activeTab === 'content' && (
        <>
          <Section id="info" title={localLabels.info} icon={Calendar}>
            <input
              type="text"
              value={invitation.title || ''}
              onChange={e => onInvitationChange({ ...invitation, title: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 h-12 px-4 rounded-xl text-sm"
              placeholder={t.title_placeholder}
            />

            <input
              type="text"
              value={invitation.host_names || ''}
              onChange={e => onInvitationChange({ ...invitation, host_names: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 h-12 px-4 rounded-xl text-sm"
              placeholder={t.hosts_placeholder}
            />

            <textarea
              value={invitation.description || ''}
              onChange={e => onInvitationChange({ ...invitation, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm min-h-[96px] resize-none"
              placeholder={t.description_placeholder}
            />

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input
                type="text"
                value={invitation.event_address || ''}
                onChange={e => onInvitationChange({ ...invitation, event_address: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 h-12 pl-11 pr-4 rounded-xl text-sm"
                placeholder={t.address_placeholder}
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none z-10" />
              <input
                type="date"
                value={invitation.event_date?.split('T')[0] || ''}
                onChange={e => onInvitationChange({ ...invitation, event_date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 h-12 pl-11 pr-4 rounded-xl text-sm appearance-none"
              />
            </div>
          </Section>

          <Section id="program" title={localLabels.program} icon={Sparkles}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-400">{t.program_title}</span>
              <button type="button" onClick={addProgramStep} className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {(invitation.event_program || []).map((step: any, index: number) => (
                <div key={index} className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={step.time}
                      onChange={e => updateProgramStep(index, 'time', e.target.value)}
                      className="w-24 bg-white border border-gray-100 h-10 px-2 rounded-lg text-[11px] font-bold"
                    />
                    <input
                      type="text"
                      value={step.activity}
                      onChange={e => updateProgramStep(index, 'activity', e.target.value)}
                      placeholder={t.activity_placeholder}
                      className="flex-1 bg-white border border-gray-100 h-10 px-3 rounded-lg text-[11px]"
                    />
                    <button type="button" onClick={() => removeProgramStep(index)} className="p-1.5 bg-red-50 text-red-500 rounded-full">
                      <X size={14} />
                    </button>
                  </div>

                  <label className={`flex items-center gap-3 p-2 bg-white rounded-xl cursor-pointer border border-gray-100 ${!isPremium ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                      {step.image_url ? <img src={step.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="text-gray-300" />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{step.image_url ? t.modify_photo : t.add_photo}</span>
                    {!isPremium && <Lock size={12} className="ml-auto text-gray-400" />}
                    <input type="file" className="hidden" accept={IMAGE_ACCEPT} onChange={e => uploadProgramImage(e, index)} />
                  </label>
                </div>
              ))}
            </div>
          </Section>

          <Section id="premiumStory" title={localLabels.premium_story_label} icon={Sparkles} premium>
            <div className={`${!isPremium ? 'opacity-60 grayscale' : ''} space-y-4`}>
              {[
                {
                  title: localLabels.premium_mid_label,
                  titleKey: 'premium_mid_title',
                  textKey: 'premium_mid_text',
                  photoKey: 'premium_mid_photo_url',
                  titlePlaceholder: localLabels.premium_mid_title_placeholder,
                  textPlaceholder: localLabels.premium_mid_text_placeholder
                },
                {
                  title: localLabels.premium_final_label,
                  titleKey: 'premium_final_title',
                  textKey: 'premium_final_text',
                  photoKey: 'premium_final_photo_url',
                  titlePlaceholder: localLabels.premium_final_title_placeholder,
                  textPlaceholder: localLabels.premium_final_text_placeholder
                }
              ].map(section => (
                <div key={section.titleKey} className="space-y-3 bg-amber-50/60 rounded-2xl p-4 border border-amber-100">
                  <label className="text-[10px] font-black uppercase text-gray-600">{section.title}</label>

                  <input
                    type="text"
                    value={invitation[section.titleKey] || ''}
                    disabled={!isPremium}
                    onChange={e => onInvitationChange({ ...invitation, [section.titleKey]: e.target.value })}
                    className="w-full bg-white border border-amber-100 h-12 px-4 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 disabled:cursor-not-allowed"
                    placeholder={section.titlePlaceholder || localLabels.premium_title_placeholder}
                  />

                  <textarea
                    value={invitation[section.textKey] || ''}
                    disabled={!isPremium}
                    onChange={e => onInvitationChange({ ...invitation, [section.textKey]: e.target.value })}
                    className="w-full bg-white border border-amber-100 p-4 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 min-h-[100px] resize-none disabled:cursor-not-allowed"
                    placeholder={section.textPlaceholder || localLabels.premium_text_placeholder}
                  />

                  <label className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 cursor-pointer ${!isPremium ? 'pointer-events-none' : ''}`}>
                    <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center overflow-hidden border border-amber-100">
                      {invitation[section.photoKey] ? (
                        <img src={invitation[section.photoKey]} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={18} className="text-amber-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="block text-[10px] font-black uppercase text-gray-700 truncate">
                        {localLabels.premium_photo}
                      </span>
                      <span className="block text-[10px] font-bold text-gray-400 truncate">
                        {invitation[section.photoKey] ? t.modify_photo : t.add_photo}
                      </span>
                    </div>

                    {uploading ? <span className="text-[9px] font-black text-amber-600 uppercase">Upload...</span> : <Plus size={16} className="text-amber-500" />}

                    <input
                      type="file"
                      className="hidden"
                      accept={IMAGE_ACCEPT}
                      disabled={!isPremium}
                      onChange={e => {
                        if (!checkPremiumAccess(false)) return;
                        uploadFile(e, section.photoKey);
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {activeTab === 'media' && (
        <>
          <Section id="mainMedia" title={localLabels.media} icon={ImageIcon}>
            <div className="grid grid-cols-2 gap-3">
              <UploadBox
                label={localLabels.main_photo}
                value={invitation.main_photo_url}
                onChange={(e: any) => uploadFile(e, 'main_photo_url')}
              />

              <UploadBox
                label={localLabels.end_photo}
                value={invitation.end_photo_url}
                premium
                onChange={(e: any) => uploadFile(e, 'end_photo_url')}
              />

              {invitation.opening_type === 'filmstrip' && (
                <>
                  <UploadBox
                    label={filmstripPhoto2Label}
                    value={invitation.photo_url_2}
                    premium
                    onChange={(e: any) => uploadFile(e, 'photo_url_2')}
                  />

                  <UploadBox
                    label={filmstripPhoto3Label}
                    value={invitation.photo_url_3}
                    premium
                    onChange={(e: any) => uploadFile(e, 'photo_url_3')}
                  />
                </>
              )}

              <label className="col-span-2 flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <Music className="text-gray-400 shrink-0" size={20} />
                <span className="text-[10px] font-black text-gray-500 uppercase truncate">
                  {invitation.music_url ? t.music_loaded : t.upload_music}
                </span>
                <input type="file" className="hidden" accept=".mp3,audio/mpeg" onChange={e => uploadFile(e, 'music_url')} />
              </label>
            </div>
          </Section>

          {(invitation.main_photo_url || invitation.end_photo_url || invitation.photo_url_2 || invitation.photo_url_3) && (
            <Section id="adjustMedia" title={localLabels.adjust} icon={Move}>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedPhotoKey('main_photo_url')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'main_photo_url' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>
                  {localLabels.main_photo}
                </button>
                {invitation.photo_url_2 && (
                  <button type="button" onClick={() => setSelectedPhotoKey('photo_url_2')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'photo_url_2' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>
                    {filmstripPhoto2Label}
                  </button>
                )}
                {invitation.photo_url_3 && (
                  <button type="button" onClick={() => setSelectedPhotoKey('photo_url_3')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'photo_url_3' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>
                    {filmstripPhoto3Label}
                  </button>
                )}
                {invitation.end_photo_url && (
                  <button type="button" onClick={() => setSelectedPhotoKey('end_photo_url')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'end_photo_url' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>
                    {localLabels.end_photo}
                  </button>
                )}
              </div>

              <div
                className="w-full h-[420px] bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm cursor-move touch-none flex items-center justify-center"
                onMouseDown={e => {
                  dragRef.current = { x: e.clientX, y: e.clientY, isDragging: true, lastDist: 0 };
                }}
                onTouchStart={e => {
                  if (e.touches.length === 2) {
                    const dist = Math.hypot(
                      e.touches[0].clientX - e.touches[1].clientX,
                      e.touches[0].clientY - e.touches[1].clientY
                    );

                    dragRef.current = { ...dragRef.current, isDragging: true, lastDist: dist };
                  } else {
                    dragRef.current = {
                      x: e.touches[0].clientX,
                      y: e.touches[0].clientY,
                      isDragging: true,
                      lastDist: 0
                    };
                  }
                }}
                onMouseMove={handleDragMove}
                onTouchMove={handleDragMove}
                onMouseUp={() => (dragRef.current.isDragging = false)}
                onMouseLeave={() => (dragRef.current.isDragging = false)}
                onTouchEnd={() => {
                  dragRef.current.isDragging = false;
                  dragRef.current.lastDist = 0;
                }}
                onWheel={handleWheel}
              >
                <img
                  src={invitation[selectedPhotoKey]}
                  style={{
                    transform: `translate(${invitation[`${selectedPhotoKey}_pos_x`] || 0}px, ${invitation[`${selectedPhotoKey}_pos_y`] || 0}px) scale(${invitation[`${selectedPhotoKey}_scale`] || 1})`,
                    pointerEvents: 'none'
                  }}
                  className="max-w-full max-h-full object-contain origin-center"
                />
              </div>
            </Section>
          )}
        </>
      )}

      {activeTab === 'style' && (
        <>
          <Section id="opening" title={localLabels.opening} icon={Film} premium>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                  {localLabels.opening_mode_label}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <OptionButton
                    active={openingMode === 'envelope'}
                    icon={ImageIcon}
                    label={localLabels.opening_mode_panel}
                    onClick={() => handleOpeningModeClick('envelope')}
                  />

                  <OptionButton
                    active={openingMode === 'video'}
                    premium
                    icon={Film}
                    label={localLabels.opening_mode_video}
                    onClick={() => handleOpeningModeClick('video')}
                  />
                </div>
              </div>

              {openingMode === 'video' && (
                <div className={`${!isPremium ? 'opacity-55 grayscale' : ''} space-y-4 rounded-2xl bg-amber-50/60 p-4 border border-amber-100`}>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">
                      {localLabels.opening_category_label}
                    </label>
                    <select
                      value={selectedOpeningCategory}
                      disabled={!isPremium}
                      onChange={e => handleOpeningCategoryChange(e.target.value)}
                      className="w-full h-12 bg-white border border-amber-100 rounded-xl px-4 text-sm font-bold text-gray-800 disabled:cursor-not-allowed outline-none"
                    >
                      {OPENING_CATEGORIES.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">
                      {localLabels.opening_theme_label}
                    </label>
                    <select
                      value={selectedOpeningTheme}
                      disabled={!isPremium}
                      onChange={e => handleOpeningThemeChange(e.target.value)}
                      className="w-full h-12 bg-white border border-amber-100 rounded-xl px-4 text-sm font-bold text-gray-800 disabled:cursor-not-allowed outline-none"
                    >
                      {availableOpeningThemes.map(theme => (
                        <option key={theme.id} value={theme.id}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                  {localLabels.opening_type_label}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <OptionButton
                    active={invitation.opening_type === 'vinyl' || !invitation.opening_type}
                    icon={Disc}
                    label={translations[lang].opening_types.vinyl}
                    onClick={() => handleOpeningTypeClick('vinyl', false)}
                  />
                  <OptionButton
                    active={invitation.opening_type === 'filmstrip'}
                    premium
                    icon={Film}
                    label={translations[lang].opening_types.filmstrip}
                    onClick={() => handleOpeningTypeClick('filmstrip', true)}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section id="look" title={localLabels.look} icon={Sparkles}>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">{t.envelope_color}</label>
                <div className="flex gap-3 overflow-x-auto pt-1 pb-2 px-1 scrollbar-hide">
                  {COLOR_PALETTES.map(p => (
                    <Swatch
                      key={p.color}
                      value={p.color}
                      selected={invitation.envelope_color === p.color}
                      onClick={() => onInvitationChange({ ...invitation, envelope_color: p.color })}
                    />
                  ))}
                  {PREMIUM_PALETTES.map(p => (
                    <Swatch
                      key={p.id}
                      value={p.gradient}
                      gradient
                      premium
                      selected={invitation.envelope_color === p.gradient}
                      onClick={() => handlePremiumClick(p.gradient)}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-gray-500">{localLabels.paper_section_label}</label>
                  <div className="flex bg-white p-1 rounded-lg border border-amber-100">
                    <button
                      type="button"
                      onClick={() => setPaperMode('texture')}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${paperMode === 'texture' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}
                    >
                      {localLabels.paper_mode_texture}
                    </button>
                    <button
                      type="button"
                      onClick={() => (isPremium ? setPaperMode('color') : checkPremiumAccess(false))}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${paperMode === 'color' ? 'bg-amber-500 text-white' : 'text-gray-400'} ${!isPremium ? 'opacity-60' : ''}`}
                    >
                      {localLabels.paper_mode_color}
                      {!isPremium && <Lock size={10} />}
                    </button>
                  </div>
                </div>

                {paperMode === 'texture' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {TEXTURES.map(texture => (
                      <OptionButton
                        key={texture.id}
                        active={invitation.paper_type === texture.id}
                        premium={texture.premium}
                        label={texture.name}
                        onClick={() => handleTextureClick(texture.id, texture.premium)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3 overflow-x-auto pt-1 pb-2 px-1 scrollbar-hide">
                      {PAPER_COLOR_PALETTES.map(p => (
                        <Swatch
                          key={p.color}
                          value={p.color}
                          selected={invitation.paper_color === p.color}
                          onClick={() => handlePaperColorClick(p.color)}
                        />
                      ))}
                      {PREMIUM_PALETTES.map(p => (
                        <Swatch
                          key={p.id}
                          value={p.gradient}
                          gradient
                          premium
                          selected={invitation.paper_color === p.gradient}
                          onClick={() => handlePaperPremiumClick(p.gradient)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section id="ambiance" title={localLabels.ambiance} icon={PartyPopper}>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleTriggerModeSwitch('emoji')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                  triggerMode === 'emoji' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-400'
                }`}
              >
                {localLabels.trigger_mode_emoji}
              </button>

              <button
                type="button"
                onClick={() => handleTriggerModeSwitch('decor')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${
                  triggerMode === 'decor' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-400'
                } ${!isPremium ? 'opacity-60' : ''}`}
              >
                {localLabels.trigger_mode_decor}
                {!isPremium && <Lock size={10} />}
              </button>
            </div>

            {triggerMode === 'decor' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <OptionButton active={invitation.background_theme === 'balloons'} premium icon={PartyPopper} label={localLabels.bg_balloons} onClick={() => handleBackgroundThemeClick('balloons', true)} />
                  <OptionButton active={invitation.background_theme === 'flowers'} premium icon={Heart} label={localLabels.bg_flowers} onClick={() => handleBackgroundThemeClick('flowers', true)} />
                  <OptionButton active={invitation.background_theme === 'butterflies'} premium icon={Sparkles} label={localLabels.bg_butterflies} onClick={() => handleBackgroundThemeClick('butterflies', true)} />
                  <OptionButton active={invitation.background_theme === 'stars'} premium icon={Sparkles} label={localLabels.bg_stars} onClick={() => handleBackgroundThemeClick('stars', true)} />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">{localLabels.bg_color_label}</label>
                  <div className="flex gap-3 overflow-x-auto pt-1 pb-2 px-1 scrollbar-hide">
                    {COLOR_PALETTES.map(p => (
                      <Swatch
                        key={p.color}
                        value={p.color}
                        premium
                        selected={invitation.background_color === p.color}
                        onClick={() => handleBackgroundPremiumClick(p.color)}
                      />
                    ))}
                    {PREMIUM_PALETTES.map(p => (
                      <Swatch
                        key={p.id}
                        value={p.gradient}
                        gradient
                        premium
                        selected={invitation.background_color === p.gradient}
                        onClick={() => handleBackgroundPremiumClick(p.gradient)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {EVENT_TYPES.map(type => (
                  <OptionButton
                    key={type.id}
                    active={invitation.event_type === type.id}
                    premium={type.premium}
                    icon={type.icon}
                    label={type.name}
                    onClick={() => handleThemeClick(type.id, type.premium)}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section id="fonts" title={localLabels.fonts} icon={Sparkles}>
            <div className="space-y-2">
              {FONTS.map(f => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => handleFontClick(f.family, f.premium)}
                  className={`w-full h-12 px-4 rounded-xl text-left border transition-all relative ${
                    invitation.font_style === f.family ? 'border-amber-400 bg-amber-50' : 'bg-gray-50 border-gray-100'
                  } ${f.premium && !isPremium ? 'opacity-50 grayscale' : ''}`}
                  style={{ fontFamily: f.family }}
                >
                  <span className="text-sm">{f.name}</span>
                  {f.premium && !isPremium && <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />}
                </button>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
