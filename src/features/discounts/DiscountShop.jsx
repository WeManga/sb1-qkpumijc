import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { translations } from '../../lib/i18n';

export function DiscountShop({ coins, onPurchase, lang = 'en' }) {
  const t = translations[lang]?.shop || translations.en.shop;
  const [offers, setOffers] = useState([]);
  const [purchasingId, setPurchasingId] = useState(null);
  const [error, setError] = useState('');
  const [revealedCode, setRevealedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from('discount_offers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setOffers(data || []));
  }, []);

  const handleBuy = async (offer) => {
    setPurchasingId(offer.id);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('purchase-discount', {
        body: { offer_id: offer.id }
      });
      if (fnError || !data?.ok) throw new Error(data?.error || t.insufficient);

      setRevealedCode({ code: data.code, discountPercent: data.discountPercent });
      onPurchase?.(data.newBalance);
    } catch (err) {
      setError(err.message);
    } finally {
      setPurchasingId(null);
    }
  };

  const handleCopy = () => {
    if (!revealedCode) return;
    navigator.clipboard.writeText(revealedCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const affordable = coins >= offer.coin_cost;
        return (
          <motion.div
            key={offer.id}
            whileHover={{ scale: affordable ? 1.02 : 1 }}
            className={`flex items-center justify-between p-4 rounded-2xl border ${
              affordable ? 'bg-white border-amber-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
                <Percent className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">{offer.discount_percent}% {t.discount_suffix}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {offer.coin_cost.toLocaleString('vi-VN')} {t.coins_unit}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleBuy(offer)}
              disabled={!affordable || purchasingId === offer.id}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {purchasingId === offer.id ? <Loader2 size={14} className="animate-spin" /> : t.buy}
            </button>
          </motion.div>
        );
      })}

      {error && <p className="text-center text-xs font-bold text-rose-500 pt-2">{error}</p>}

      <AnimatePresence>
        {revealedCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-5 bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-2xl text-center space-y-3"
          >
            <p className="text-[11px] text-amber-700 font-black uppercase tracking-widest">
              {t.code_unlocked_prefix} {revealedCode.discountPercent}% {t.code_unlocked_suffix}
            </p>
            <p className="text-[10px] text-gray-500 font-medium leading-snug">
              {t.code_instructions}
            </p>

            <div className="flex items-center justify-center gap-2">
              <code className="px-4 py-2 bg-white border border-amber-200 rounded-xl text-sm font-black tracking-widest text-gray-900">
                {revealedCode.code}
              </code>
              <button
                onClick={handleCopy}
                className="w-10 h-10 flex items-center justify-center bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
