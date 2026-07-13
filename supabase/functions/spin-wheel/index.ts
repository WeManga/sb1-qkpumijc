import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), { status: 401, headers: corsHeaders });
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("coins, bonus_spins")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ ok: false, error: "Wallet introuvable" }), { status: 404, headers: corsHeaders });
    }

    // Cooldown 24h glissant : on regarde le dernier spin "gratuit" (pas un bonus)
    const { data: lastFreeSpin } = await supabase
      .from("wheel_spins")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("used_bonus_spin", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    let nextAvailableAt: Date | null = null;

    if (lastFreeSpin) {
      const lastSpinDate = new Date(lastFreeSpin.created_at);
      nextAvailableAt = new Date(lastSpinDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const hasFreeSpinLeft = !nextAvailableAt || nextAvailableAt <= now;
    const hasBonusSpin = wallet.bonus_spins > 0;

    if (!hasFreeSpinLeft && !hasBonusSpin) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Aucun tour disponible pour le moment",
          nextAvailableAt: nextAvailableAt?.toISOString()
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    const useBonusSpin = !hasFreeSpinLeft && hasBonusSpin;

    const { data: prizes, error: prizesError } = await supabase
      .from("wheel_prizes")
      .select("*")
      .eq("is_active", true);

    if (prizesError || !prizes || prizes.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Configuration de la roue introuvable" }), { status: 500, headers: corsHeaders });
    }

    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let winningPrize = prizes[0];

    for (const prize of prizes) {
      random -= prize.weight;
      if (random <= 0) {
        winningPrize = prize;
        break;
      }
    }

    let newCoins = wallet.coins;
    let newBonusSpins = wallet.bonus_spins - (useBonusSpin ? 1 : 0);

    if (winningPrize.prize_type === "coins") {
      newCoins += winningPrize.coin_value;
    } else if (winningPrize.prize_type === "retry") {
      newBonusSpins += 1;
    }

    const { error: updateError } = await supabase
      .from("wallets")
      .update({ coins: newCoins, bonus_spins: newBonusSpins, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    const { error: spinInsertError } = await supabase.from("wheel_spins").insert({
      user_id: user.id,
      prize_id: winningPrize.id,
      coins_won: winningPrize.prize_type === "coins" ? winningPrize.coin_value : 0,
      used_bonus_spin: useBonusSpin
    });

    if (spinInsertError) throw spinInsertError;

    if (winningPrize.prize_type === "coins" && winningPrize.coin_value > 0) {
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        amount: winningPrize.coin_value,
        type: "wheel_spin",
        metadata: { prize_id: winningPrize.id }
      });
    }

    const newNextAvailableAt = useBonusSpin
      ? nextAvailableAt?.toISOString() ?? null
      : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        ok: true,
        prize: winningPrize,
        newBalance: newCoins,
        bonusSpinsLeft: newBonusSpins,
        nextAvailableAt: newNextAvailableAt
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
