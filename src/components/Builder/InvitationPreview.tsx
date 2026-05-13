import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { 
  Heart, PartyPopper, Sparkles, Baby, MapPin, 
  Music, Image as ImageIcon, Calendar, Plus, X, Move, Skull, Milk, Lock,
  Disc, Film, Hand, Key, Vault
} from 'lucide-react';
import { PREMIUM_COLORS } from '../../constants/colors';

const COLOR_PALETTES = [
  { color: '#FEE2E2' }, { color: '#E0F2FE' }, { color: '#DCFCE7' },
  { color: '#FEF3C7' }, { color: '#EF4444' }, { color: '#1E3A8A' },
  { color: '#F5F5DC' }, { color: '#7C3AED' }, { color: '#374151' },
  { color: '#000000' }, { color: '#FFFFFF' }, { color: '#FFD700' },
  { color: '#FF69B4' }, { color: '#8B4513' }
];

const PREMIUM_PALETTES = [
  { id: 'satin_gold', name: 'Satin Gold', gradient: PREMIUM_COLORS.satin_gold },
  { id: 'satin_silver', name: 'Satin Silver', gradient: PREMIUM_COLORS.satin_silver },
  { id: 'chrome_rose', name: 'Chrome Rose', gradient: PREMIUM_COLORS.chrome_rose },
  { id: 'chrome_black', name: 'Chrome Black', gradient: PREMIUM_COLORS.chrome_black },
  { id: 'chrome_blue', name: 'Chrome Blue', gradient: PREMIUM_COLORS.chrome_blue },
];

const FONTS = [
  { id: 'font-sans', name: 'Moderne Pur', family: "ui-sans-serif, system-ui, sans-serif", premium: false },
  { id: 'font-serif', name: 'Classique Chic', family: "ui-serif, Georgia, serif", premium: false },
  { id: 'font-elegant', name: 'Élégance Riviera', family: "'Times New Roman', serif", premium: false },
  { id: 'font-script', name: 'Plume Douce', family: "cursive", premium: false },
  { id: 'font-royal', name: 'Royal Majesty', family: "'Apple Chancery', 'Zapfino', cursive", premium: true },
  { id: 'font-vintage', name: 'Héritage Ancien', family: "'Copperplate', 'Papyrus', serif", premium: true },
  { id: 'font-boho', name: 'Bohème Spirit', family: "'Bradley Hand', cursive", premium: true },
  { id: 'font-luxury', name: 'Luxe Minimal', family: "'Didot', 'Bodoni MT', serif", premium: true }
];

const TEXTURES = [
  { id: 'smooth', name: 'Smooth', premium: false },
  { id: 'parchment', name: 'Parchment', premium: false },
  { id: 'grainy', name: 'Grainy', premium: true },
  { id: 'cotton', name: 'Cotton', premium: true },
  { id: 'silk', name: 'Silk', premium: true },
  { id: 'velvet', name: 'Velvet', premium: true },
];

export function BuilderSidebar({ invitation, onInvitationChange, activeTab }: any) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhotoKey, setSelectedPhotoKey] = useState('main_photo_url');
  const dragRef = useRef<{ x: number, y: number, isDragging: boolean, lastDist: number }>({ x: 0, y: 0, isDragging: false, lastDist: 0 });
  
  const lang = (invitation.language as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].builder;

  const handlePremiumClick = (colorValue: string) => {
    if (invitation.plan_type !== 'PREMIUM') {
      alert(lang === 'vi' ? "Vui lòng nâng cấp lên bản Premium để sử dụng màu này!" : lang === 'en' ? "Please upgrade to Premium to use this color!" : "Passez au Premium pour débloquer ces couleurs !");
      return;
    }
    onInvitationChange({...invitation, envelope_color: colorValue});
  };

  const handleThemeClick = (themeId: string, isPremium: boolean) => {
    if (isPremium && invitation.plan_type !== 'PREMIUM') {
      alert("Passez au Premium pour débloquer ce thème !");
      return;
    }
    onInvitationChange({...invitation, event_type: themeId});
  };

  const handleFontClick = (fontFamily: string, isPremium: boolean) => {
    if (isPremium && invitation.plan_type !== 'PREMIUM') {
      alert("Passez au Premium pour débloquer cette calligraphie !");
      return;
    }
    onInvitationChange({...invitation, font_style: fontFamily});
  };

  const handleTextureClick = (textureId: string, isPremium: boolean) => {
    if (isPremium && invitation.plan_type !== 'PREMIUM') {
      alert(lang === 'vi' ? "Vui lòng nâng cấp để sử dụng chất liệu này!" : lang === 'en' ? "Please upgrade to use this texture!" : "Passez au Premium pour débloquer cette texture !");
      return;
    }
    onInvitationChange({...invitation, paper_type: textureId});
  };

  const EVENT_TYPES = [
    { id: 'wedding', name: t.theme_wedding, icon: Heart, premium: false },
    { id: 'birthday', name: t.theme_birthday, icon: PartyPopper, premium: false },
    { id: 'party', name: t.theme_party, icon: Sparkles, premium: true },
    { id: 'baptism', name: t.theme_baptism, icon: Baby, premium: true },
    { id: 'babyshower', name: 'Babyshower', icon: Milk, premium: true },
    { id: 'funeral', name: 'Funeral', icon: Skull, premium: true }
  ];

  const uploadFile = async (e: any, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    try {
      const { error } = await supabase.storage.from('invitations').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('invitations').getPublicUrl(fileName);
      onInvitationChange({ ...invitation, [field]: data.publicUrl });
    } catch (err) { alert("Erreur d'upload"); } 
    finally { setUploading(false); }
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
    const newProgram = invitation.event_program.filter((_: any, i: number) => i !== index);
    onInvitationChange({ ...invitation, event_program: newProgram });
  };

  const handleDragMove = (e: any) => {
    if (!dragRef.current.isDragging) return;
    const posKeyX = `${selectedPhotoKey}_pos_x`;
    const posKeyY = `${selectedPhotoKey}_pos_y`;
    const scaleKey = `${selectedPhotoKey}_scale`;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = (clientX - dragRef.current.x);
    const deltaY = (clientY - dragRef.current.y);
    onInvitationChange({ ...invitation, [posKeyX]: (invitation[posKeyX] || 0) + deltaX, [posKeyY]: (invitation[posKeyY] || 0) + deltaY });
    dragRef.current.x = clientX; dragRef.current.y = clientY;
  };

  return (
    <div className="w-full space-y-8 pb-10">
      {activeTab === 'style' && (
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">Type d'ouverture</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onInvitationChange({...invitation, opening_style: 'default'})}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${invitation.opening_style !== 'knock' && invitation.opening_style !== 'key' && invitation.opening_style !== 'vault' ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}>
                <ImageIcon size={18} className={invitation.opening_style === 'default' ? 'text-amber-500' : 'text-gray-400'} />
                <span className="text-[10px] font-bold uppercase">Volet</span>
              </button>
              <button onClick={() => { if (invitation.plan_type !== 'PREMIUM') return alert("Passez au Premium !"); onInvitationChange({...invitation, opening_style: 'knock'}); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all relative ${invitation.opening_style === 'knock' ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}>
                <Hand size={18} className={invitation.opening_style === 'knock' ? 'text-amber-500' : 'text-gray-400'} />
                <span className="text-[10px] font-bold uppercase">Main</span>
                {invitation.plan_type !== 'PREMIUM' && <Lock size={12} className="absolute right-2 top-2 text-gray-400" />}
              </button>
              <button onClick={() => { if (invitation.plan_type !== 'PREMIUM') return alert("Passez au Premium !"); onInvitationChange({...invitation, opening_style: 'key'}); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all relative ${invitation.opening_style === 'key' ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}>
                <Key size={18} className={invitation.opening_style === 'key' ? 'text-amber-500' : 'text-gray-400'} />
                <span className="text-[10px] font-bold uppercase">Clé</span>
                {invitation.plan_type !== 'PREMIUM' && <Lock size={12} className="absolute right-2 top-2 text-gray-400" />}
              </button>
              <button onClick={() => { if (invitation.plan_type !== 'PREMIUM') return alert("Passez au Premium !"); onInvitationChange({...invitation, opening_style: 'vault'}); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all relative ${invitation.opening_style === 'vault' ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}>
                <Vault size={18} className={invitation.opening_style === 'vault' ? 'text-amber-500' : 'text-gray-400'} />
                <span className="text-[10px] font-bold uppercase">Coffre</span>
                {invitation.plan_type !== 'PREMIUM' && <Lock size={12} className="absolute right-2 top-2 text-gray-400" />}
              </button>
            </div>
          </div>
          {/* Autres sections de style... */}
        </div>
      )}
    </div>
  );
}