import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShoppingBag } from 'lucide-react';
import { CoinBalance } from '../wallet/CoinBalance';
import { DiscountShop } from '../discounts/DiscountShop';
import { translations } from '../../lib/i18n';

export function ShopModal({ isOpen, onClose, coins, onOpenWheel, onPurchase, lang = 'en' }) {
  const t = translations[lang]?.shop || translations.en.shop;
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] border-t border-gray-100 overflow-hidden"
        >
          <div className="w-full flex justify-center py-3 shrink-0 bg-gray-50/30">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="px-8 pb-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t.title}</h3>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                  {t.subtitle}
                </p>
              </div>
            </div>

            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <CoinBalance coins={coins} onClick={onClose} />

              <button
                onClick={onOpenWheel}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles size={14} />
                {t.spin_wheel_btn}
              </button>
            </div>

            <DiscountShop coins={coins} onPurchase={onPurchase} lang={lang} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
