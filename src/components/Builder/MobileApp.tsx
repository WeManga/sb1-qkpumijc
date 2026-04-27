import { useState } from 'react';
import { InvitationPreview } from './InvitationPreview';
import { BuilderSidebar } from './BuilderSidebar';
import { Type, Palette, Music, X, Check, Loader2, ArrowLeft, Disc, Film, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations, Language } from '../../lib/i18n';

export default function MobileApp({ invitation, onInvitationChange, onSave, onBack, saving }: any) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const lang = (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].builder;

  const navItems = [
    { id: 'content', label: t.nav_info, icon: <Type size={22}/> },
    { id: 'style', label: t.nav_style, icon: <Palette size={22}/> },
    { id: 'media', label: t.nav_media, icon: <Music size={22}/> }
  ];

  return (
    <div className="fixed inset-0 bg-[#F5F5F7] flex flex-col overflow-hidden h-screen w-screen font-sans antialiased text-[#1D1D1F]">
      
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 z-[150] shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-[#007AFF] font-medium">
          <ArrowLeft size={20} />
          <span>{t.back_btn}</span>
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-gray-900">Invit Studio<span className="text-amber-500">.</span></span>
        </div>

        <button onClick={onSave} disabled={saving} className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95">
          {saving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}
          {t.save_btn}
        </button>
      </header>

      <main className="flex-1 relative flex items-center justify-center z-10 p-6 pb-28">
        <div className="w-full h-full max-w-sm">
            <InvitationPreview invitation={invitation} />
        </div>
      </main>

      <AnimatePresence>
        {activeTab && (
          <div className="absolute inset-0 z-[200] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setActiveTab(null)} 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 32, stiffness: 350 }} 
              className="relative bg-white rounded-t-[3.5rem] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-5 mb-2" />
                <div className="flex justify-between items-center px-10 py-5 border-b border-gray-50">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-800">
                      {activeTab === 'content' ? t.edit_info : activeTab === 'style' ? t.edit_style : t.edit_media}
                    </h3>
                    <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={18}/></button>
                </div>
                <div className="overflow-y-auto px-8 py-8 pb-32 scrollbar-hide">
                    
                    {/* SÉLECTEUR DE STYLE - APPARAÎT DANS L'ONGLET STYLE */}
                    {activeTab === 'style' && (
                      <div className="mb-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Style d'animation</h4>
                          {invitation.plan_type === 'PREMIUM' && <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">PREMIUM</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => onInvitationChange({ ...invitation, opening_type: 'vinyl' })}
                            className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all ${invitation.opening_type !== 'filmstrip' ? 'border-amber-500 bg-amber-50/30' : 'border-gray-100 bg-gray-50'}`}
                          >
                            <div className={`p-3 rounded-full ${invitation.opening_type !== 'filmstrip' ? 'bg-amber-500 text-white' : 'bg-white text-gray-400'}`}><Disc size={20}/></div>
                            <span className="text-[10px] font-black uppercase">Vinyle</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              if(invitation.plan_type === 'PREMIUM') {
                                onInvitationChange({ ...invitation, opening_type: 'filmstrip' });
                              } else {
                                alert("Cette option nécessite un compte Premium");
                              }
                            }}
                            className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all relative overflow-hidden ${invitation.opening_type === 'filmstrip' ? 'border-amber-500 bg-amber-50/30' : 'border-gray-100 bg-gray-50'}`}
                          >
                            <div className={`p-3 rounded-full ${invitation.opening_type === 'filmstrip' ? 'bg-amber-500 text-white' : 'bg-white text-gray-400'}`}><Film size={20}/></div>
                            <span className="text-[10px] font-black uppercase">Pellicule</span>
                            {invitation.plan_type !== 'PREMIUM' && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]"><Lock size={14} className="text-gray-400"/></div>}
                          </button>
                        </div>
                      </div>
                    )}

                    <BuilderSidebar invitation={invitation} onInvitationChange={onInvitationChange} activeTab={activeTab} />
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="h-24 bg-white/90 backdrop-blur-2xl border-t border-gray-100 flex items-center justify-around px-6 pb-8 z-[180] fixed bottom-0 inset-x-0">
        {navItems.map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${activeTab === item.id ? 'text-amber-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`p-3 rounded-[1.25rem] transition-all duration-300 ${activeTab === item.id ? 'bg-amber-50 shadow-inner' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}