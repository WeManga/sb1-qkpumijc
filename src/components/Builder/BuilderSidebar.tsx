import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { 
  Heart, PartyPopper, Sparkles, MapPin, 
  Music, Image as ImageIcon, Loader2, Calendar, Move, Plus, X 
} from 'lucide-react';

const CrossIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2h2v20h-2z" /><path d="M7 7h10v2H7z" /></svg>
);
const AngelIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="2" /><path d="M12 9v7l-3 4" /><path d="M12 16l3 4" /><path d="M7 10c-2 0-3 1-3 3s1 3 3 3h1" /><path d="M17 10c2 0 3 1 3 3s-1 3-3 3h-1" /></svg>
);
const BabyBottleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V10z" /><path d="M10 10V5a2 2 0 0 1 4 0v5" /><path d="M12 2v2" /></svg>
);

const PAPER_TYPES = [
  { id: 'smooth', name: 'Lisse' },
  { id: 'parchment', name: 'Parchemin' },
  { id: 'grainy', name: 'Granulé' },
  { id: 'cotton', name: 'Coton' }
];

const FONTS = [
  { id: 'font-sans', name: 'Moderne', family: 'Inter, sans-serif' },
  { id: 'font-serif', name: 'Classique', family: 'Georgia, serif' },
  { id: 'font-elegant', name: 'Élégant', family: "'Playfair Display', serif" },
  { id: 'font-script', name: 'Manuscrit', family: "'Dancing Script', cursive" }
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

  return (
    <div className="w-full space-y-8 pb-10">
      {/* ONGLET CONTENU */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400">Texte principal</label>
            <input type="text" value={invitation.title || ''} onChange={e => onInvitationChange({...invitation, title: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Titre" />
            <input type="text" value={invitation.host_names || ''} onChange={e => onInvitationChange({...invitation, host_names: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Hôtes" />
            <input type="text" value={invitation.event_address || ''} onChange={e => onInvitationChange({...invitation, event_address: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Lieu" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 block">Médias (Photo & Musique)</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <ImageIcon className="text-gray-400 mb-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Photo</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => uploadFile(e, 'main_photo_url')} />
              </label>
              <label className="flex flex-col items-center justify-center aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <Music className="text-gray-400 mb-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Musique</span>
                <input type="file" className="hidden" accept="audio/*" onChange={e => uploadFile(e, 'music_url')} />
              </label>
            </div>
          </div>
          
          {/* Positionnement Photo */}
          {invitation.main_photo_url && (
            <div className="space-y-4 bg-gray-50 p-6 rounded-[2rem]">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Move size={14}/> Position de la photo</label>
              <div className="space-y-6">
                <input type="range" min="0" max="100" value={invitation.photo_pos_x || 50} onChange={e => onInvitationChange({...invitation, photo_pos_x: parseInt(e.target.value)})} className="w-full accent-amber-500" />
                <input type="range" min="0" max="100" value={invitation.photo_pos_y || 50} onChange={e => onInvitationChange({...invitation, photo_pos_y: parseInt(e.target.value)})} className="w-full accent-amber-500 h-10 [writing-mode:bt-lr] appearance-slider-vertical" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ONGLET STYLE */}
      {activeTab === 'style' && (
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block">Texture du papier</label>
            <div className="grid grid-cols-2 gap-2">
              {PAPER_TYPES.map(p => (
                <button key={p.id} onClick={() => onInvitationChange({...invitation, paper_type: p.id})} className={`p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${invitation.paper_type === p.id ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-100 bg-white text-gray-400'}`}>{p.name}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block">Style de police</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button key={f.id} onClick={() => onInvitationChange({...invitation, font_style: f.family})} style={{ fontFamily: f.family }} className={`p-4 rounded-xl border-2 text-sm transition-all ${invitation.font_style === f.family ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm' : 'bg-white border-gray-100 text-gray-500'}`}>{f.name}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block">Type d'événement</label>
            <div className="grid grid-cols-2 gap-3">
              {[ 
                {id: 'wedding', icon: <Heart size={16}/>, l: 'Mariage'}, 
                {id: 'birthday', icon: <PartyPopper size={16}/>, l: 'Anniversaire'}, 
                {id: 'party', icon: <Sparkles size={16}/>, l: 'Fête'}, 
                {id: 'baptism', icon: <AngelIcon size={18}/>, l: 'Baptême'},
                {id: 'baby_shower', icon: <BabyBottleIcon size={18}/>, l: 'Babyshower'},
                {id: 'evjf_evg', icon: <CrossIcon size={18}/>, l: 'Enterrements'}
              ].map(t_item => (
                <button key={t_item.id} onClick={() => onInvitationChange({...invitation, event_type: t_item.id})} className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-[10px] font-bold uppercase transition-all ${invitation.event_type === t_item.id ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-400'}`}>{t_item.icon} {t_item.l}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}