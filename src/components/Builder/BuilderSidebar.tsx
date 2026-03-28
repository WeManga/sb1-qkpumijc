import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { 
  Heart, 
  PartyPopper, 
  Sparkles, 
  Baby, 
  X, 
  Clock, 
  MapPin, 
  Music, 
  Image as ImageIcon, 
  Loader2, 
  Calendar,
  Move
} from 'lucide-react';

const PASTELS = [
  { name: 'Rose', color: '#FEE2E2' }, 
  { name: 'Bleu Ciel', color: '#E0F2FE' },
  { name: 'Bleu Profond', color: '#DBEAFE' }, 
  { name: 'Jaune', color: '#FEF9C3' },
  { name: 'Menthe', color: '#DCFCE7' }, 
  { name: 'Violet', color: '#F3E8FF' },
  { name: 'Pêche', color: '#FFEDD5' }, 
  { name: 'Gris Perle', color: '#F3F4F6' }
];

export function BuilderSidebar({ invitation, onInvitationChange, activeTab }: any) {
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('invite_lang') as Language) || 'en'
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const savedLang = localStorage.getItem('invite_lang') as Language;
      if (savedLang) setLang(savedLang);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = translations[lang].builder;

  const uploadFile = async (e: any, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { error } = await supabase.storage.from('invitations').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('invitations').getPublicUrl(fileName);
      onInvitationChange({ ...invitation, [field]: data.publicUrl });
    } catch (err) { 
      console.error(err);
      alert("Erreur d'upload : Vérifiez que le bucket 'invitations' est bien créé sur Supabase en mode PUBLIC."); 
    } finally { 
      setUploading(false); 
    }
  };

  const updateProgram = (index: number, field: string, value: string) => {
    const newProg = [...(invitation.event_program || [])];
    newProg[index] = { ...newProg[index], [field]: value };
    onInvitationChange({ ...invitation, event_program: newProg });
  };

  return (
    <div className="w-full space-y-8 pb-10">
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
              {t.general_info}
            </label>
            <input 
              type="text" 
              value={invitation.title || ''} 
              onChange={e => onInvitationChange({...invitation, title: e.target.value})} 
              className="w-full bg-gray-50 border-none h-12 px-4 rounded-2xl text-sm" 
              placeholder={t.title_placeholder} 
            />
            <input 
              type="text" 
              value={invitation.host_names || ''} 
              onChange={e => onInvitationChange({...invitation, host_names: e.target.value})} 
              className="w-full bg-gray-50 border-none h-12 px-4 rounded-2xl text-sm" 
              placeholder={t.hosts_placeholder} 
            />
            
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                <input 
                  type="text" 
                  value={invitation.event_address || ''} 
                  onChange={e => onInvitationChange({...invitation, event_address: e.target.value})} 
                  className="w-full bg-gray-50 border-none h-12 pl-12 pr-4 rounded-2xl text-sm" 
                  placeholder={t.address_placeholder} 
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                <input 
                  type="date" 
                  value={invitation.event_date?.split('T')[0] || ''} 
                  onChange={e => onInvitationChange({...invitation, event_date: e.target.value})} 
                  className="w-full bg-gray-50 border-none h-12 pl-12 pr-4 rounded-2xl text-sm" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h4 className="text-[10px] font-black uppercase text-amber-700 mb-4 flex items-center gap-2">
              <Clock size={12}/> {t.program_title}
            </h4>
            <div className="space-y-3">
              {(invitation.event_program || []).map((p: any, i: number) => (
                <div key={i} className="flex gap-2 bg-white border border-gray-100 p-2 rounded-xl shadow-sm">
                  <input type="time" value={p.time} onChange={e => updateProgram(i, 'time', e.target.value)} className="w-20 text-[10px] bg-gray-50 h-10 px-2 rounded-lg" />
                  <input type="text" value={p.activity} onChange={e => updateProgram(i, 'activity', e.target.value)} className="flex-1 text-[10px] bg-gray-50 h-10 px-2 rounded-lg" placeholder={t.activity_placeholder} />
                  <button onClick={() => { const n = [...invitation.event_program]; n.splice(i, 1); onInvitationChange({...invitation, event_program: n}); }} className="p-2 text-red-200 hover:text-red-400">
                    <X size={14}/>
                  </button>
                </div>
              ))}
              <button 
                onClick={() => onInvitationChange({...invitation, event_program: [...(invitation.event_program || []), {time: '18:00', activity: ''}]})} 
                className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 uppercase hover:border-amber-200 hover:text-amber-500 transition-colors"
              >
                {t.add_step}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONGLET STYLE */}
      {activeTab === 'style' && (
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{t.envelope_color}</label>
            <div className="grid grid-cols-4 gap-3">
              {PASTELS.map(p => (
                <button 
                  key={p.color} 
                  onClick={() => onInvitationChange({...invitation, envelope_color: p.color})} 
                  style={{backgroundColor: p.color}} 
                  className={`h-12 rounded-2xl border-4 transition-all ${invitation.envelope_color === p.color ? 'border-amber-400 scale-110 shadow-lg' : 'border-white shadow-sm'}`} 
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">{t.theme_label}</label>
            <div className="grid grid-cols-2 gap-3">
              {[ 
                {id: 'wedding', icon: <Heart size={16}/>, l: t.theme_wedding}, 
                {id: 'birthday', icon: <PartyPopper size={16}/>, l: t.theme_birthday}, 
                {id: 'party', icon: <Sparkles size={16}/>, l: t.theme_party}, 
                {id: 'baptism', icon: <Baby size={16}/>, l: t.theme_baptism} 
              ].map(t_item => (
                <button 
                  key={t_item.id} 
                  onClick={() => onInvitationChange({...invitation, event_type: t_item.id})} 
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-[10px] font-bold uppercase transition-all ${invitation.event_type === t_item.id ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-400'}`}
                >
                  {t_item.icon} {t_item.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET MÉDIAS */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div>
            {/* CHANGEMENT : JUSTE "MEDIA" COMME DEMANDÉ */}
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block ml-1">MEDIA</label>
            
            <label className="relative flex flex-col items-center justify-center h-56 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden hover:bg-gray-100 transition-colors">
               {invitation.main_photo_url ? (
                 <img 
                    src={invitation.main_photo_url} 
                    className="w-full h-full object-cover" 
                    style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }}
                    alt="Preview" 
                 />
               ) : (
                 <div className="text-center">
                   <ImageIcon className="w-8 h-8 mx-auto text-gray-300"/>
                   <span className="text-[9px] font-bold text-gray-400 uppercase mt-2 block">{t.upload_photo}</span>
                 </div>
               )}
               <input type="file" className="hidden" accept="image/*" onChange={e => uploadFile(e, 'main_photo_url')} />
               {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500"/></div>}
            </label>

            {/* NOUVEAU : REPOSITIONNEMENT DE L'IMAGE */}
            {invitation.main_photo_url && (
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  <Move size={12}/> Ajuster la position
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase mb-1"><span>Horizontal</span><span>{invitation.photo_pos_x || 50}%</span></div>
                    <input 
                      type="range" min="0" max="100" 
                      value={invitation.photo_pos_x || 50} 
                      onChange={e => onInvitationChange({...invitation, photo_pos_x: e.target.value})}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase mb-1"><span>Vertical</span><span>{invitation.photo_pos_y || 50}%</span></div>
                    <input 
                      type="range" min="0" max="100" 
                      value={invitation.photo_pos_y || 50} 
                      onChange={e => onInvitationChange({...invitation, photo_pos_y: e.target.value})}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-amber-50/50 rounded-[2.5rem] border border-amber-100">
             <label className="text-[10px] font-black uppercase text-amber-800 mb-4 block text-center">{t.music_label}</label>
             <label className="flex flex-col items-center justify-center h-24 bg-white rounded-2xl border-2 border-dashed border-amber-200 cursor-pointer hover:border-amber-400 transition-colors">
                <Music className="w-6 h-6 text-amber-300"/>
                <span className="text-[9px] font-black text-amber-400 uppercase mt-2">{t.upload_music}</span>
                <input type="file" className="hidden" accept="audio/mp3,audio/mpeg" onChange={e => uploadFile(e, 'music_url')} />
             </label>
             {invitation.music_url && <p className="text-[9px] text-green-600 font-bold text-center mt-3 uppercase tracking-widest italic">✓ {t.music_saved}</p>}
          </div>
        </div>
      )}
    </div>
  );
}