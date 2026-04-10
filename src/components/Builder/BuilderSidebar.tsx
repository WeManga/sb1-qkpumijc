import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';
import { 
  Heart, PartyPopper, Sparkles, MapPin, 
  Music, Image as ImageIcon, Loader2, Calendar, Move, Plus, X, Lock
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

  return (
    <div className="w-full space-y-8 pb-10">
      {activeTab === 'content' && (
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Infos générales</label>
          <input type="text" value={invitation.title || ''} onChange={e => onInvitationChange({...invitation, title: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Nom de l'événement" />
          <input type="text" value={invitation.host_names || ''} onChange={e => onInvitationChange({...invitation, host_names: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Nom des hôtes" />
          <input type="text" value={invitation.event_address || ''} onChange={e => onInvitationChange({...invitation, event_address: e.target.value})} className="w-full bg-gray-50 border-none h-14 px-4 rounded-2xl text-sm" placeholder="Lieu de l'événement" />
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block">Texture du papier</label>
            <div className="grid grid-cols-2 gap-2">
              {PAPER_TYPES.map(p => (
                <button key={p.id} onClick={() => onInvitationChange({...invitation, paper_type: p.id})} className={`p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${invitation.paper_type === p.id ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>{p.name}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block">Style d'écriture</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button key={f.id} onClick={() => onInvitationChange({...invitation, font_style: f.family})} style={{ fontFamily: f.family }} className={`p-4 rounded-xl border-2 text-sm transition-all ${invitation.font_style === f.family ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}>{f.name}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block">Catégorie</label>
            <div className="grid grid-cols-2 gap-3">
              {[ 
                {id: 'wedding', icon: <Heart size={16}/>, l: 'Mariage'}, 
                {id: 'birthday', icon: <PartyPopper size={16}/>, l: 'Anniversaire'}, 
                {id: 'party', icon: <Sparkles size={16}/>, l: 'Fête'}, 
                {id: 'baptism', icon: <AngelIcon size={18}/>, l: 'Baptême'},
                {id: 'baby_shower', icon: <BabyBottleIcon size={18}/>, l: 'Baby Shower'},
                {id: 'evjf_evg', icon: <CrossIcon size={18}/>, l: 'Enterrement'}
              ].map(t_item => (
                <button key={t_item.id} onClick={() => onInvitationChange({...invitation, event_type: t_item.id})} className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-[10px] font-bold uppercase transition-all ${invitation.event_type === t_item.id ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400'}`}>{t_item.icon} {t_item.l}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}