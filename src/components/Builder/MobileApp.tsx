import { useState } from 'react';
import { InvitationPreview } from './InvitationPreview';
import { BuilderSidebar } from './BuilderSidebar';
import { Type, Palette, Music, X, Check, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileApp({ invitation, onInvitationChange, onSave, onBack, saving }: any) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // RÉORGANISATION : Suppression de 'share' pour ne garder que 3 éléments
  const navItems = [
    { id: 'content', label: 'Infos', icon: <Type size={22}/> },
    { id: 'style', label: 'Style', icon: <Palette size={22}/> },
    { id: 'media', label: 'Médias', icon: <Music size={22}/> }
  ];

  return (
    <div className="fixed inset-0 bg-[#F5F5F7] flex flex-col overflow-hidden h-screen w-screen font-sans antialiased text-[#1D1D1F]">
      
      {/* HEADER */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 z-[150] shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-[#007AFF] font-medium"><ArrowLeft size={20} /><span>Retour</span></button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-gray-900">Invit Studio<span className="text-amber-500">.</span></span>
        </div>
        <button onClick={onSave} disabled={saving} className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95">
          {saving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}
          Enregistrer
        </button>
      </header>

      {/* PREVIEW CENTRALE */}
      <main className="flex-1 relative flex items-center justify-center z-10 p-6 pb-28">
        <div className="w-full h-full max-w-sm">
            <InvitationPreview invitation={invitation} />
        </div>
      </main>

      {/* TIROIR ÉDITEUR */}
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
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-800">Modifier {activeTab === 'content' ? 'Infos' : activeTab === 'style' ? 'Style' : 'Médias'}</h3>
                    <button onClick={() => setActiveTab(null)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={18}/></button>
                </div>
                <div className="overflow-y-auto px-8 py-8 pb-32 scrollbar-hide">
                    <BuilderSidebar invitation={invitation} onInvitationChange={onInvitationChange} activeTab={activeTab} />
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVIGATION BASSE RÉORGANISÉE */}
      {/* L'utilisation de flex-1 et justify-around répartit automatiquement les 3 boutons */}
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