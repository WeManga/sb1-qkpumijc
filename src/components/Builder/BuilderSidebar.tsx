import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { 
  Heart, PartyPopper, Sparkles, Baby, MapPin, 
  Music, Image as ImageIcon, Calendar, Plus, X, Move, Skull, Milk, Lock,
  Disc, Film, Hand
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
    } catch (err) { 
      alert("Erreur d'upload"); 
    } 
    finally { setUploading(false); }
  };

  const uploadProgramImage = async (e: any, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (invitation.plan_type !== 'PREMIUM') {
      alert("Passez au Premium pour ajouter des photos au programme !");
      return;
    }
    setUploading(true);
    const fileName = `prog-${Date.now()}-${index}.${file.name.split('.').pop()}`;
    try {
      const { error } = await supabase.storage.from('invitations').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('invitations').getPublicUrl(fileName);
      const newProgram = [...(invitation.event_program || [])];
      newProgram[index] = { ...newProgram[index], image_url: data.publicUrl };
      onInvitationChange({ ...invitation, event_program: newProgram });
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

    if (e.touches && e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (dragRef.current.lastDist > 0) {
        const delta = (dist - dragRef.current.lastDist) / 100;
        const newScale = Math.max(1, Math.min(5, (invitation[scaleKey] || 1) + delta));
        onInvitationChange({ ...invitation, [scaleKey]: newScale });
      }
      dragRef.current.lastDist = dist;
      return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = (clientX - dragRef.current.x);
    const deltaY = (clientY - dragRef.current.y);

    onInvitationChange({ 
      ...invitation, 
      [posKeyX]: (invitation[posKeyX] || 0) + deltaX, 
      [posKeyY]: (invitation[posKeyY] || 0) + deltaY 
    });
    
    dragRef.current.x = clientX;
    dragRef.current.y = clientY;
  };

  const handleWheel = (e: any) => {
    const scaleKey = `${selectedPhotoKey}_scale`;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(1, Math.min(5, (invitation[scaleKey] || 1) + delta));
    onInvitationChange({ ...invitation, [scaleKey]: newScale });
  };

  return (
    <div className="w-full space-y-8 pb-10">
      
      {activeTab === 'content' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{t.general_info}</label>
            <input type="text" value={invitation.title || ''} onChange={e => onInvitationChange({...invitation, title: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder={t.title_placeholder} />
            <input type="text" value={invitation.host_names || ''} onChange={e => onInvitationChange({...invitation, host_names: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder={t.hosts_placeholder} />
            
            <textarea 
              value={invitation.description || ''} 
              onChange={e => onInvitationChange({...invitation, description: e.target.value})} 
              className="w-full bg-gray-50 border-none p-4 rounded-2xl text-sm min-h-[100px] resize-none" 
              placeholder="Texte d'accueil..."
            />

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input type="text" value={invitation.event_address || ''} onChange={e => onInvitationChange({...invitation, event_address: e.target.value})} className="w-full bg-gray-50 border-none h-14 pl-12 pr-4 rounded-2xl text-sm" placeholder={t.address_placeholder} />
            </div>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none z-10" />
              <input 
                type="date" 
                value={invitation.event_date?.split('T')[0] || ''} 
                onChange={e => onInvitationChange({...invitation, event_date: e.target.value})} 
                className="w-full bg-gray-50 border-none h-14 min-h-[3.5rem] flex items-center pl-12 pr-4 rounded-2xl text-sm appearance-none" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase text-gray-400">{t.program_title}</label>
              <button onClick={addProgramStep} className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Plus size={16} /></button>
            </div>
            <div className="space-y-3">
              {(invitation.event_program || []).map((step: any, index: number) => (
                <div key={index} className="space-y-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex gap-2 items-center">
                    <input type="time" value={step.time} onChange={e => updateProgramStep(index, 'time', e.target.value)} className="w-24 bg-gray-50 border-none h-10 px-2 rounded-xl text-[11px] font-bold" />
                    <input type="text" value={step.activity} onChange={e => updateProgramStep(index, 'activity', e.target.value)} placeholder={t.activity_placeholder} className="flex-1 bg-gray-50 border-none h-10 px-3 rounded-xl text-[11px]" />
                    <button onClick={() => removeProgramStep(index)} className="p-1.5 bg-red-50 text-red-500 rounded-full"><X size={14}/></button>
                  </div>
                  <label className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-gray-100">
                      {step.image_url ? <img src={step.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="text-gray-300" />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{step.image_url ? "Modifier photo" : "Ajouter photo"}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadProgramImage(e, index)} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Photos & Musique</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden relative">
                {invitation.main_photo_url ? (
                  <img src={invitation.main_photo_url} className="w-full h-full object-cover opacity-30" alt="Preview" />
                ) : <ImageIcon className="text-gray-400 mb-2" />}
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase bg-white/40 text-center px-2">
                  Photo de début
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'main_photo_url')} />
              </label>

              <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden relative">
                {invitation.end_photo_url ? (
                  <img src={invitation.end_photo_url} className="w-full h-full object-cover opacity-30" alt="Preview" />
                ) : <Sparkles className="text-gray-400 mb-2" />}
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase bg-white/40 text-center px-2 flex flex-col items-center gap-1">
                  Photo de fin
                  {invitation.plan_type !== 'PREMIUM' && <Lock size={16} className="text-gray-400" />}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  if(invitation.plan_type !== 'PREMIUM') return alert("Passez au Premium !");
                  uploadFile(e, 'end_photo_url');
                }} />
              </label>

              {invitation.opening_type === 'filmstrip' && (
                <>
                  <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-amber-200 cursor-pointer overflow-hidden relative">
                    {invitation.photo_url_2 ? (
                      <img src={invitation.photo_url_2} className="w-full h-full object-cover opacity-30" />
                    ) : <Film size={20} className="text-amber-200 mb-2" />}
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-amber-900 uppercase bg-white/40 text-center px-2">
                      Vue 02
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'photo_url_2')} />
                  </label>

                  <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-amber-200 cursor-pointer overflow-hidden relative">
                    {invitation.photo_url_3 ? (
                      <img src={invitation.photo_url_3} className="w-full h-full object-cover opacity-30" />
                    ) : <Film size={20} className="text-amber-200 mb-2" />}
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-amber-900 uppercase bg-white/40 text-center px-2">
                      Vue 03
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'photo_url_3')} />
                  </label>
                </>
              )}
              
              <label className="col-span-2 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer transition-colors hover:bg-gray-100">
                <Music className="text-gray-400 shrink-0" size={20} />
                <span className="text-[10px] font-bold text-gray-500 uppercase truncate">
                  {invitation.music_url ? "Musique chargée ✓" : t.upload_music}
                </span>
                <input type="file" className="hidden" accept=".mp3,audio/mpeg" onChange={(e) => uploadFile(e, 'music_url')} />
              </label>
            </div>
          </div>

          {(invitation.main_photo_url || invitation.end_photo_url) && (
            <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedPhotoKey('main_photo_url')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'main_photo_url' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>Début</button>
                {invitation.end_photo_url && <button onClick={() => setSelectedPhotoKey('end_photo_url')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'end_photo_url' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>Fin</button>}
                {invitation.photo_url_2 && <button onClick={() => setSelectedPhotoKey('photo_url_2')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'photo_url_2' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>Vue 2</button>}
                {invitation.photo_url_3 && <button onClick={() => setSelectedPhotoKey('photo_url_3')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedPhotoKey === 'photo_url_3' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200'}`}>Vue 3</button>}
              </div>
              
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-2">
                <Move size={12}/> Ajuster la photo sélectionnée
              </span>
              <div 
                className="w-full aspect-video rounded-2xl bg-gray-200 overflow-hidden relative border-2 border-white shadow-sm cursor-move touch-none"
                onMouseDown={(e) => { dragRef.current = { x: e.clientX, y: e.clientY, isDragging: true, lastDist: 0 }; }}
                onTouchStart={(e) => { dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, isDragging: true, lastDist: 0 }; }}
                onMouseMove={handleDragMove}
                onTouchMove={handleDragMove}
                onWheel={handleWheel}
                onMouseUp={() => dragRef.current.isDragging = false}
                onMouseLeave={() => dragRef.current.isDragging = false}
                onTouchEnd={() => { dragRef.current.isDragging = false; dragRef.current.lastDist = 0; }}
              >
                <img 
                  src={invitation[selectedPhotoKey]} 
                  style={{ 
                    transform: `translate(${invitation[`${selectedPhotoKey}_pos_x`] || 0}px, ${invitation[`${selectedPhotoKey}_pos_y`] || 0}px) scale(${invitation[`${selectedPhotoKey}_scale`] || 1})`,
                    pointerEvents: 'none'
                  }} 
                  className="w-full h-full object-cover transition-transform duration-75 origin-center"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-8">
          {/* NOUVEAU : TYPE D'OUVERTURE */}
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">Type d'ouverture</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onInvitationChange({...invitation, opening_style: 'default'})}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${invitation.opening_style !== 'knock' ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}
              >
                <ImageIcon size={18} className={invitation.opening_style !== 'knock' ? 'text-amber-500' : 'text-gray-400'} />
                <span className="text-[10px] font-bold uppercase">Ouverture Volet</span>
              </button>
              
              <button 
                onClick={() => {
                  if (invitation.plan_type !== 'PREMIUM') return alert("Passez au Premium pour l'ouverture Main !");
                  onInvitationChange({...invitation, opening_style: 'knock'});
                }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all relative ${invitation.opening_style === 'knock' ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}
              >
                <Hand size={18} className={invitation.opening_style === 'knock' ? 'text-amber-500' : 'text-gray-400'} />
                <span className="text-[10px] font-bold uppercase">Ouverture Main</span>
                {invitation.plan_type !== 'PREMIUM' && <Lock size={12} className="absolute right-2 top-2 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{t.theme_label}</label>
            <div className="grid grid-cols-2 gap-3">
              {EVENT_TYPES.map(type => (
                <button key={type.id} onClick={() => handleThemeClick(type.id, type.premium)} 
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all relative ${invitation.event_type === type.id ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}>
                  <type.icon size={18} className={invitation.event_type === type.id ? 'text-amber-500' : 'text-gray-400'} />
                  <span className="text-[10px] font-bold uppercase">{type.name}</span>
                  {type.premium && invitation.plan_type !== 'PREMIUM' && (
                    <Lock size={12} className="absolute right-2 top-2 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">Texture</label>
            <div className="grid grid-cols-2 gap-2">
              {TEXTURES.map(texture => (
                <button key={texture.id} onClick={() => handleTextureClick(texture.id, texture.premium)} 
                  className={`p-4 rounded-xl border-2 text-[10px] font-bold transition-all relative flex items-center justify-center ${invitation.paper_type === texture.id ? 'border-amber-400 bg-amber-50' : 'bg-gray-50 border-transparent'}`}>
                  {texture.name.toUpperCase()}
                  {texture.premium && invitation.plan_type !== 'PREMIUM' && (
                    <Lock size={10} className="absolute right-2 top-2 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{t.envelope_color}</label>
            <div className="flex gap-3 overflow-x-auto pt-2 pb-6 px-4 -mx-4 scrollbar-hide">
              {COLOR_PALETTES.map(p => (
                <button key={p.color} onClick={() => onInvitationChange({...invitation, envelope_color: p.color})} style={{backgroundColor: p.color}} 
                  className={`h-12 w-12 shrink-0 rounded-full border-4 transition-all ${invitation.envelope_color === p.color ? 'border-amber-400 scale-110 shadow-lg' : 'border-white shadow-sm'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-amber-600 mb-4 flex items-center gap-2 ml-1">
              <span className="flex items-center gap-2"><Sparkles size={12}/> COULEUR SATINS</span>
            </label>
            <div className="flex gap-3 overflow-x-auto pt-2 pb-4 px-4 -mx-4 scrollbar-hide">
              {PREMIUM_PALETTES.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => handlePremiumClick(p.gradient)} 
                  style={{ background: p.gradient }} 
                  className={`h-14 w-14 shrink-0 rounded-2xl border-4 relative flex items-center justify-center transition-all ${invitation.envelope_color === p.gradient ? 'border-amber-400 scale-110 shadow-lg' : 'border-white shadow-sm'}`}
                >
                  {invitation.plan_type !== 'PREMIUM' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                      <Lock size={14} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{t.font_style_label}</label>
            <div className="space-y-2">
              {FONTS.map(f => (
                <button key={f.id} onClick={() => handleFontClick(f.family, f.premium)} 
                  className={`w-full h-14 px-4 rounded-2xl text-left border-2 transition-all relative ${invitation.font_style === f.family ? 'border-amber-400 bg-amber-50' : 'bg-gray-50 border-transparent'}`} style={{ fontFamily: f.family }}>
                  {f.name}
                  {f.premium && invitation.plan_type !== 'PREMIUM' && (
                    <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}