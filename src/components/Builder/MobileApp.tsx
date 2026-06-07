import { useState, useEffect, type CSSProperties } from 'react';
import { InvitationPreview } from './InvitationPreview';
import { BuilderSidebar } from './BuilderSidebar';
import { Type, Palette, Music, X, Check, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations, Language } from '../../lib/i18n';

const BRAND_FONT_LINK_ID = 'invit-studio-brand-font';
const BRAND_LOGO_SRC =
  'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png';

const brandTitleStyle: CSSProperties = {
  fontFamily: '"Great Vibes", cursive',
  fontWeight: 400,
  letterSpacing: '0',
  color: '#c7a068',
  textShadow:
    '0 1px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(92,62,28,0.22), 0 8px 18px rgba(0,0,0,0.12)'
};

export default function MobileApp({ invitation, onInvitationChange, onSave, onBack, saving }: any) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const lang = (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].builder;

  useEffect(() => {
    if (!document.getElementById(BRAND_FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = BRAND_FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const navItems = [
    { id: 'content', label: t.nav_info, icon: <Type size={22} /> },
    { id: 'style', label: t.nav_style, icon: <Palette size={22} /> },
    { id: 'media', label: t.nav_media, icon: <Music size={22} /> }
  ];

  return (
    <div className="fixed inset-0 bg-[#F5F5F7] flex flex-col overflow-hidden h-screen w-screen font-sans antialiased text-[#1D1D1F]">
      <header className="h-16 bg-white/85 backdrop-blur-xl border-b border-gray-200/50 grid grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-5 z-[150] shrink-0 gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[#007AFF] font-medium min-w-0"
        >
          <ArrowLeft size={20} className="shrink-0" />
          <span className="text-sm truncate">{t.back_btn}</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 min-w-0">
          <img
            src={BRAND_LOGO_SRC}
            alt="Invit Studio"
            className="h-11 w-auto object-contain shrink-0"
          />

          <span
            className="text-[1.65rem] sm:text-[1.9rem] leading-none whitespace-nowrap"
            style={brandTitleStyle}
          >
            Invit Studio
          </span>
        </div>

        <div className="flex justify-end min-w-0">
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-black text-white px-3 sm:px-4 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-60 max-w-full"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : <Check className="w-3 h-3 shrink-0" />}
            <span className="truncate">{t.save_btn}</span>
          </button>
        </div>
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 350 }}
              className="relative bg-white rounded-t-[3.5rem] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-5 mb-2" />

              <div className="flex justify-between items-center px-10 py-5 border-b border-gray-50">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-800">
                  {activeTab === 'content' ? t.edit_info : activeTab === 'style' ? t.edit_style : t.edit_media}
                </h3>

                <button
                  onClick={() => setActiveTab(null)}
                  className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-8 py-8 pb-32 scrollbar-hide">
                <BuilderSidebar
                  invitation={invitation}
                  onInvitationChange={onInvitationChange}
                  activeTab={activeTab}
                />
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
            className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${
              activeTab === item.id ? 'text-amber-600 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div
              className={`p-3 rounded-[1.25rem] transition-all duration-300 ${
                activeTab === item.id ? 'bg-amber-50 shadow-inner' : ''
              }`}
            >
              {item.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
