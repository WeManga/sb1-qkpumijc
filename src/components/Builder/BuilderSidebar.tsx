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
      {/* SECTION CONTENU */}
      {activeTab === 'content' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Informations Générales</label>
            <div className="grid gap-3">
              <input type="text" value={invitation.title || ''} onChange={e => onInvitationChange({...invitation, title: e.target.value})} className="w-full bg-white border border-gray-100 h-14 px-5 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Titre de l'événement" />
              <input type="text" value={invitation.host_names || ''} onChange={e => onInvitationChange({...invitation, host_names: e.target.value})} className="w-full bg-white border border-gray-100 h-14 px-5 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Noms des hôtes" />
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 w-4 h-4" />
                <input type="text" value={invitation.event_address || ''} onChange={e => onInvitationChange({...invitation, event_address: e.target.value})} className="w-full bg-white border border-gray-100 h-14 pl-12 pr-5 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Lieu de réception" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 w-4 h-4" />
                <input type="date" value={invitation.event_date?.split('T')[0] || ''} onChange={e => onInvitationChange({...invitation, event_date: e.target.value})} className="w-full bg-white border border-gray-100 h-14 pl-12 pr-5 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Le Programme</label>
              <button onClick={addProgramStep} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-200">
                <Plus size={14} strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase">Ajouter</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {(invitation.event_program || []).map((step: any, index: number) => (
                <div key={index} className="flex gap-2 items-center bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                  <div className="w-20 shrink-0 relative">
                    <Clock size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="time" 
                      value={step.time} 
                      onChange={e => updateProgramStep(index, 'time', e.target.value)} 
                      className="w-full bg-gray-50 border-none h-10 pl-6 pr-2 rounded-xl text-[11px] font-bold text-gray-700 focus:ring-1 focus:ring-amber-400" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={step.activity} 
                    onChange={e => updateProgramStep(index, 'activity', e.target.value)} 
                    placeholder="Ex: Cocktail, Dîner..." 
                    className="flex-1 bg-gray-50 border-none h-10 px-4 rounded-xl text-[11px] focus:ring-1 focus:ring-amber-400" 
                  />
                  <button 
                    onClick={() => removeProgramStep(index)} 
                    className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shrink-0"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION STYLE */}
      {activeTab === 'style' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5 block ml-1">Couleur de l'enveloppe</label>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {COLOR_PALETTES.map(p => (
                <button 
                  key={p.color} 
                  onClick={() => onInvitationChange({...invitation, envelope_color: p.color})} 
                  style={{backgroundColor: p.color}} 
                  className={`h-14 w-14 shrink-0 rounded-2xl border-4 transition-all transform ${invitation.envelope_color === p.color ? 'border-amber-400 scale-110 rotate-3 shadow-xl' : 'border-white shadow-md hover:scale-105'}`} 
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5 block ml-1">Typographie</label>
            <div className="grid grid-cols-2 gap-3">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => onInvitationChange({...invitation, font_style: f.family})}
                  style={{ fontFamily: f.family }}
                  className={`p-5 rounded-[1.5rem] border-2 text-sm transition-all text-center flex items-center justify-center min-h-[70px] ${invitation.font_style === f.family ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-inner' : 'bg-white border-gray-50 text-gray-500 hover:border-gray-200 shadow-sm'}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5 block ml-1">Univers Visuel</label>
            <div className="grid grid-cols-2 gap-3">
              {[ 
                {id: 'wedding', icon: <Heart size={16}/>, l: 'Mariage'}, 
                {id: 'birthday', icon: <PartyPopper size={16}/>, l: 'Anniversaire'}, 
                {id: 'party', icon: <Sparkles size={16}/>, l: 'Fête'}, 
                {id: 'baptism', icon: <Baby size={16}/>, l: 'Baptême'} 
              ].map(t_item => (
                <button key={t_item.id} onClick={() => onInvitationChange({...invitation, event_type: t_item.id})} className={`p-5 rounded-[1.5rem] border-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${invitation.event_type === t_item.id ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border-gray-50 text-gray-400 shadow-sm hover:border-gray-200'}`}>
                  {t_item.icon} {t_item.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION MEDIA */}
      {activeTab === 'media' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Photographie</label>
            <label className="relative flex flex-col items-center justify-center h-72 bg-white rounded-[3rem] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden group shadow-sm hover:border-amber-400 transition-all">
               {invitation.main_photo_url ? (
                 <img 
                   src={invitation.main_photo_url} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                   style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} 
                 />
               ) : (
                 <div className="text-center px-6">
                   <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-100 transition-colors">
                     <ImageIcon className="w-8 h-8 text-amber-500"/>
                   </div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Importer une image</span>
                 </div>
               )}
               <input type="file" className="hidden" accept="image/*" onChange={e => uploadFile(e, 'main_photo_url')} />
               {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-amber-500" size={32}/></div>}
            </label>
          </div>

          {invitation.main_photo_url && (
            <div className="p-6 bg-white rounded-[2.5rem] space-y-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest"><Move size={14}/> Centrer la photo</div>
              <div className="space-y-4">
                <div className="space-y-2">
                   <p className="text-[9px] font-bold text-gray-400 uppercase">Horizontal</p>
                   <input type="range" min="0" max="100" value={invitation.photo_pos_x || 50} onChange={e => onInvitationChange({...invitation, photo_pos_x: e.target.value})} className="w-full h-2 bg-gray-100 rounded-lg accent-amber-500 cursor-ew-resize" />
                </div>
                <div className="space-y-2">
                   <p className="text-[9px] font-bold text-gray-400 uppercase">Vertical</p>
                   <input type="range" min="0" max="100" value={invitation.photo_pos_y || 50} onChange={e => onInvitationChange({...invitation, photo_pos_y: e.target.value})} className="w-full h-2 bg-gray-100 rounded-lg accent-amber-500 cursor-ns-resize" />
                </div>
              </div>
            </div>
          )}

          <div className="p-8 bg-amber-500 rounded-[3rem] text-white shadow-xl shadow-amber-200">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 block text-center">Ambiance Musicale</label>
             <label className="flex flex-col items-center justify-center h-32 bg-white/10 rounded-[2rem] border-2 border-dashed border-white/30 cursor-pointer hover:bg-white/20 transition-all group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <Music className="w-5 h-5 text-amber-600"/>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Uploader un MP3</span>
                <input type="file" className="hidden" accept="audio/mp3,audio/mpeg" onChange={e => uploadFile(e, 'music_url')} />
             </label>
             {invitation.music_url && (
               <div className="mt-4 flex items-center justify-center gap-2 text-white animate-pulse">
                 <div className="w-1 h-1 bg-white rounded-full"/>
                 <p className="text-[9px] font-black uppercase tracking-[0.2em]">Musique activée</p>
                 <div className="w-1 h-1 bg-white rounded-full"/>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}