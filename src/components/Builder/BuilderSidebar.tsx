import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { 
  Heart, PartyPopper, Sparkles, Baby, MapPin, 
  Music, Image as ImageIcon, Loader2, Calendar, Move, Plus, X, Clock 
} from 'lucide-react';

const COLOR_PALETTES = [
  { name: 'Rose Doux', color: '#FEE2E2' },
  { name: 'Bleu Nuage', color: '#E0F2FE' },
  { name: 'Menthe', color: '#DCFCE7' },
  { name: 'Ambre', color: '#FEF3C7' },
  { name: 'Rouge Passion', color: '#EF4444' },
  { name: 'Bleu Profond', color: '#1E3A8A' },
  { name: 'Noir Mat', color: '#111827' },
  { name: 'Sable', color: '#F5F5DC' },
  { name: 'Violet Satin', color: '#7C3AED' },
  { name: 'Eucalyptus', color: '#374151' }
];

const FONTS = [
  { id: 'font-sans', name: 'Moderne', family: 'Inter, sans-serif' },
  { id: 'font-serif', name: 'Classique', family: 'Georgia, serif' },
  { id: 'font-elegant', name: 'Élégant', family: "'Playfair Display', serif" },
  { id: 'font-script', name: 'Manuscrit', family: "'Dancing Script', cursive" },
  { id: 'font-mono', name: 'Minimalist', family: 'monospace' }
];

export function BuilderSidebar({ invitation, onInvitationChange, activeTab }: any) {
  const [uploading, setUploading] = useState(false);
  const [lang] = useState<Language>((localStorage.getItem('invite_lang') as Language) || 'fr');
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
    } catch (err) { alert("Erreur d'upload"); } finally { setUploading(false); }
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
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Informations</label>
            <input type="text" value={invitation.title || ''} onChange={e => onInvitationChange({...invitation, title: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Titre de l'événement" />
            <input type="text" value={invitation.host_names || ''} onChange={e => onInvitationChange({...invitation, host_names: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Noms des hôtes" />
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input type="text" value={invitation.event_address || ''} onChange={e => onInvitationChange({...invitation, event_address: e.target.value})} className="w-full bg-gray-50 border-none h-14 pl-12 pr-4 rounded-2xl text-sm" placeholder="Adresse" />
            </div>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input type="date" value={invitation.event_date?.split('T')[0] || ''} onChange={e => onInvitationChange({...invitation, event_date: e.target.value})} className="w-full bg-gray-50 border-none h-14 pl-12 pr-4 rounded-2xl text-sm" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Programme</label>
              <button onClick={addProgramStep} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              {(invitation.event_program || []).map((step: any, index: number) => (
                <div key={index} className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group">
                  <div className="w-24 shrink-0">
                    <input 
                      type="time" 
                      value={step.time} 
                      onChange={e => updateProgramStep(index, 'time', e.target.value)} 
                      className="w-full bg-gray-50 border-none h-10 px-2 rounded-xl text-[11px] font-bold text-gray-700" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={step.activity} 
                    onChange={e => updateProgramStep(index, 'activity', e.target.value)} 
                    placeholder="Activité..." 
                    className="flex-1 bg-gray-50 border-none h-10 px-3 rounded-xl text-[11px]" 
                  />
                  <button 
                    onClick={() => removeProgramStep(index)} 
                    className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors shrink-0"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">Couleur de l'enveloppe</label>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {COLOR_PALETTES.map(p => (
                <button 
                  key={p.color} 
                  onClick={() => onInvitationChange({...invitation, envelope_color: p.color})} 
                  style={{backgroundColor: p.color}} 
                  className={`h-12 w-12 shrink-0 rounded-full border-4 transition-all ${invitation.envelope_color === p.color ? 'border-amber-400 scale-110 shadow-lg' : 'border-white shadow-sm'}`} 
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">Style d'écriture</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => onInvitationChange({...invitation, font_style: f.family})}
                  style={{ fontFamily: f.family }}
                  className={`p-4 rounded-xl border-2 text-sm transition-all text-center ${invitation.font_style === f.family ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">Thème émoji</label>
            <div className="grid grid-cols-2 gap-3">
              {[ 
                {id: 'wedding', icon: <Heart size={16}/>, l: 'Mariage'}, 
                {id: 'birthday', icon: <PartyPopper size={16}/>, l: 'Anniversaire'}, 
                {id: 'party', icon: <Sparkles size={16}/>, l: 'Fête'}, 
                {id: 'baptism', icon: <Baby size={16}/>, l: 'Baptême'} 
              ].map(t_item => (
                <button key={t_item.id} onClick={() => onInvitationChange({...invitation, event_type: t_item.id})} className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-[10px] font-bold uppercase transition-all ${invitation.event_type === t_item.id ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-400'}`}>
                  {t_item.icon} {t_item.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-6">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">Photo principale</label>
          <label className="relative flex flex-col items-center justify-center h-56 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden group">
             {invitation.main_photo_url ? (
               <img 
                 src={invitation.main_photo_url} 
                 className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                 style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} 
               />
             ) : (
               <div className="text-center"><ImageIcon className="w-8 h-8 mx-auto text-gray-300"/><span className="text-[9px] font-bold text-gray-400 uppercase mt-2 block">Ajouter une photo</span></div>
             )}
             <input type="file" className="hidden" accept="image/*" onChange={e => uploadFile(e, 'main_photo_url')} />
             {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500"/></div>}
          </label>

          {invitation.main_photo_url && (
            <div className="p-5 bg-gray-50 rounded-[2rem] space-y-5 border border-gray-100">
              <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest"><Move size={12}/> Ajuster le cadrage</div>
              <div className="space-y-1">
                <input type="range" min="0" max="100" value={invitation.photo_pos_x || 50} onChange={e => onInvitationChange({...invitation, photo_pos_x: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg accent-amber-500" />
                <input type="range" min="0" max="100" value={invitation.photo_pos_y || 50} onChange={e => onInvitationChange({...invitation, photo_pos_y: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg accent-amber-500 mt-2" />
              </div>
            </div>
          )}

          <div className="p-6 bg-amber-50/50 rounded-[2.5rem] border border-amber-100">
             <label className="text-[10px] font-black uppercase text-amber-800 mb-4 block text-center">Musique de fond</label>
             <label className="flex flex-col items-center justify-center h-24 bg-white rounded-2xl border-2 border-dashed border-amber-200 cursor-pointer hover:border-amber-400 transition-colors">
                <Music className="w-6 h-6 text-amber-300"/><span className="text-[9px] font-black text-amber-400 uppercase mt-2">Uploader MP3</span>
                <input type="file" className="hidden" accept="audio/mp3,audio/mpeg" onChange={e => uploadFile(e, 'music_url')} />
             </label>
             {invitation.music_url && <p className="text-[9px] text-green-600 font-bold text-center mt-3 uppercase">✓ Musique prête</p>}
          </div>
        </div>
      )}
    </div>
  );
}