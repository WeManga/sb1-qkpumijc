import { Coins } from 'lucide-react';

export function CoinBalance({ coins, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full hover:bg-amber-100 transition-all shadow-sm"
    >
      <Coins className="w-4 h-4 text-amber-500" />
      <span className="text-xs font-black text-amber-700">{coins.toLocaleString('vi-VN')}</span>
    </button>
  );
}
