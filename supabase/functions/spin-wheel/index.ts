import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 

Deno.serve(async (req) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), { status: 401, headers });
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("coins, bonus_spins")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ ok: false, error: "Wallet introuvable" }), { status: 404, headers });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: freeSpinCountToday } = await supabase
      .from("wheel_spins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("used_bonus_spin", false)
      .gte("created_at", startOfDay.toISOString());

    const hasFreeSpinLeft = (freeSpinCountToday ?? 0) === 0;
    const hasBonusSpin = wallet.bonus_spins > 0;

    if (!hasFreeSpinLeft && !hasBonusSpin) {
      return new Response(
        JSON.stringify({ ok: false, error: "Aucun tour disponible aujourd'hui" }),
        { status: 403, headers }
      );
    }

    const useBonusSpin = !hasFreeSpinLeft && hasBonusSpin;

    const { data: prizes, error: prizesError } = await supabase
      .from("wheel_prizes")
      .select("*")
      .eq("is_active", true);

    if (prizesError || !prizes || prizes.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Configuration de la roue introuvable" }), { status: 500, headers });
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

    await supabase.from("wheel_spins").insert({
      user_id: user.id,
      prize_id: winningPrize.id,
      coins_won: winningPrize.prize_type === "coins" ? winningPrize.coin_value : 0,
      used_bonus_spin: useBonusSpin
    });

    if (winningPrize.prize_type === "coins" && winningPrize.coin_value > 0) {
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        amount: winningPrize.coin_value,
        type: "wheel_spin",
        metadata: { prize_id: winningPrize.id }
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        prize: winningPrize,
        newBalance: newCoins,
        bonusSpinsLeft: newBonusSpins
      }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers });
  }
});
