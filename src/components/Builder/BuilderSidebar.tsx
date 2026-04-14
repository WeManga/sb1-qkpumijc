import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { 
  Heart, PartyPopper, Sparkles, Baby, MapPin, 
  Music, Image as ImageIcon, Calendar, Plus, X, Move, Skull, Milk
} from 'lucide-react';

const COLOR_PALETTES = [
  { color: '#FEE2E2' }, { color: '#E0F2FE' }, { color: '#DCFCE7' },
  { color: '#FEF3C7' }, { color: '#EF4444' }, { color: '#1E3A8A' },
  { color: '#F5F5DC' }, { color: '#7C3AED' }, { color: '#374151' },
  { color: '#000000' }, { color: '#FFFFFF' }, { color: '#FFD700' },
  { color: '#FF69B4' }, { color: '#8B4513' }
];

const FONTS = [
  { id: 'font-sans', name: 'Moderne', family: 'Inter, sans-serif' },
  { id: 'font-serif', name: 'Classique', family: 'Georgia, serif' },
  { id: 'font-elegant', name: 'Élégant', family: "'Playfair Display', serif" },
  { id: 'font-script', name: 'Manuscrit', family: "'Dancing Script', cursive" },
  { id: 'font-mono', name: 'Minimalist', family: 'monospace' }
];

const EVENT_TYPES = [
  { id: 'wedding', name: 'Mariage', vi: 'Đám cưới', icon: Heart },
  { id: 'birthday', name: 'Anniversaire', vi: 'Sinh nhật', icon: PartyPopper },
  { id: 'party', name: 'Fête', vi: 'Bữa tiệc', icon: Sparkles },
  { id: 'baptism', name: 'Baptême', vi: 'Lễ rửa tội', icon: Baby },
  { id: 'babyshower', name: 'Babyshower', vi: 'Babyshower', icon: Milk },
  { id: 'funeral', name: 'Enterrement', vi: 'Tang lễ', icon: Skull }
];

export function BuilderSidebar({ invitation, onInvitationChange, activeTab }: any) {
  const [uploading, setUploading] = useState(false);
  
  const lang = (invitation.language as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].builder;

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
      // Alerte traduite
      alert(lang === 'vi' ? "Lỗi khi tải tập tin lên" : "Erreur d'upload"); 
    } 
    finally { setUploading(false); }
  };

  const addProgramStep = () => {
    const newProgram = [...(invitation.event_program || []), { time: '12:00', activity: '' }];
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
              placeholder={lang === 'vi' ? 'Nhập mô tả sự kiện...' : "Texte d'accueil ou description de l'événement..."}
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
                <div key={index} className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                  <input type="time" value={step.time} onChange={e => updateProgramStep(index, 'time', e.target.value)} className="w-24 bg-gray-50 border-none h-10 px-2 rounded-xl text-[11px] font-bold" />
                  <input type="text" value={step.activity} onChange={e => updateProgramStep(index, 'activity', e.target.value)} placeholder={t.activity_placeholder} className="flex-1 bg-gray-50 border-none h-10 px-3 rounded-xl text-[11px]" />
                  <button onClick={() => removeProgramStep(index)} className="p-1.5 bg-red-50 text-red-500 rounded-full"><X size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{lang === 'vi' ? 'PHƯƠNG TIỆN' : 'VOS MÉDIAS'}</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden relative">
                {invitation.main_photo_url ? (
                  <img src={invitation.main_photo_url} className="w-full h-full object-cover opacity-30" alt="Preview" />
                ) : <ImageIcon className="text-gray-400 mb-2" />}
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase bg-white/40 text-center px-2">
                  {lang === 'vi' ? 'Đổi ảnh' : 'Changer Photo'}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'main_photo_url')} />
              </label>
              
              <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 cursor-pointer">
                <Music className="text-gray-400 mb-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase text-center px-2">{invitation.music_url ? "OK" : "Upload MP3"}</span>
                <input type="file" className="hidden" accept=".mp3,audio/mpeg" onChange={(e) => uploadFile(e, 'music_url')} />
              </label>
            </div>
          </div>

          {invitation.main_photo_url && (
            <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 space-y-6">
              <div className="space-y-3">
                 <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-2"><Move size={12}/> {lang === 'vi' ? 'Điều chỉnh hiển thị' : "Ajustement de l'affichage"}</span>
                 <div className="w-full aspect-video rounded-2xl bg-gray-200 overflow-hidden relative border-2 border-white shadow-sm">
                    <img 
                      src={invitation.main_photo_url} 
                      style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} 
                      className="w-full h-full object-cover transition-all duration-200"
                    />
                 </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                   <span className="text-[9px] uppercase font-bold text-amber-900/40 ml-1">{lang === 'vi' ? 'Trục ngang' : 'Axe Horizontal'}</span>
                   <input type="range" min="0" max="100" value={invitation.photo_pos_x || 50} onChange={(e) => onInvitationChange({ ...invitation, photo_pos_x: parseInt(e.target.value) })} className="w-full accent-amber-600" />
                </div>
                <div className="space-y-1">
                   <span className="text-[9px] uppercase font-bold text-amber-900/40 ml-1">{lang === 'vi' ? 'Trục dọc' : 'Axe Vertical'}</span>
                   <input type="range" min="0" max="100" value={invitation.photo_pos_y || 50} onChange={(e) => onInvitationChange({ ...invitation, photo_pos_y: parseInt(e.target.value) })} className="w-full accent-amber-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{lang === 'vi' ? 'Loại sự kiện' : "Type d'événement"}</label>
            <div className="grid grid-cols-2 gap-3">
              {EVENT_TYPES.map(type => (
                <button key={type.id} onClick={() => onInvitationChange({...invitation, event_type: type.id})} 
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${invitation.event_type === type.id ? 'border-amber-400 bg-amber-50' : 'bg-white border-transparent'}`}>
                  <type.icon size={18} className={invitation.event_type === type.id ? 'text-amber-500' : 'text-gray-400'} />
                  <span className="text-[10px] font-bold uppercase">{lang === 'vi' ? (type as any).vi : type.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{lang === 'vi' ? 'Chất liệu giấy' : "Texture du papier"}</label>
            <div className="grid grid-cols-2 gap-2">
              {['smooth', 'parchment', 'grainy', 'cotton'].map(p => (
                <button key={p} onClick={() => onInvitationChange({...invitation, paper_type: p})} 
                  className={`p-4 rounded-xl border-2 text-[10px] font-bold transition-all ${invitation.paper_type === p ? 'border-amber-400 bg-amber-50' : 'bg-gray-50 border-transparent'}`}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{lang === 'vi' ? 'Màu phong bì' : "Couleur de l'enveloppe"}</label>
            <div className="flex gap-3 overflow-x-auto pt-2 pb-6 px-4 -mx-4 scrollbar-hide">
              {COLOR_PALETTES.map(p => (
                <button key={p.color} onClick={() => onInvitationChange({...invitation, envelope_color: p.color})} style={{backgroundColor: p.color}} 
                  className={`h-12 w-12 shrink-0 rounded-full border-4 transition-all ${invitation.envelope_color === p.color ? 'border-amber-400 scale-110 shadow-lg' : 'border-white shadow-sm'}`} />
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{lang === 'vi' ? 'Kiểu chữ' : "Style d'écriture"}</label>
            <div className="space-y-2">
              {FONTS.map(f => (
                <button key={f.id} onClick={() => onInvitationChange({...invitation, font_style: f.family})} 
                  className={`w-full h-14 px-4 rounded-2xl text-left border-2 transition-all ${invitation.font_style === f.family ? 'border-amber-400 bg-amber-50' : 'bg-gray-50 border-transparent'}`} style={{ fontFamily: f.family }}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}