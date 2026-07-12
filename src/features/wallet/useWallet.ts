import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function useWallet() {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [bonusSpins, setBonusSpins] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wallets')
      .select('coins, bonus_spins')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setCoins(data.coins);
      setBonusSpins(data.bonus_spins);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { coins, bonusSpins, loading, refreshWallet: fetchWallet, setCoins, setBonusSpins };
}
