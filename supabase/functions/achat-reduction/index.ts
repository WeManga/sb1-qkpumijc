import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function generateDiscountCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus
  let code = "RDX-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

Deno.serve(async (req) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    const { offer_id } = await req.json();

    if (!authHeader || !offer_id) {
      return new Response(JSON.stringify({ ok: false, error: "Requête invalide" }), { status: 400, headers });
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

    const { data: offer, error: offerError } = await supabase
      .from("discount_offers")
      .select("*")
      .eq("id", offer_id)
      .eq("is_active", true)
      .single();

    if (offerError || !offer) {
      return new Response(JSON.stringify({ ok: false, error: "Offre introuvable" }), { status: 404, headers });
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("coins")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ ok: false, error: "Wallet introuvable" }), { status: 404, headers });
    }

    if (wallet.coins < offer.coin_cost) {
      return new Response(JSON.stringify({ ok: false, error: "Solde de pièces insuffisant" }), { status: 400, headers });
    }

    const newCoins = wallet.coins - offer.coin_cost;

    const { error: updateError } = await supabase
      .from("wallets")
      .update({ coins: newCoins, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    // Génère un code unique, réessaie en cas de collision (rare)
    let discount = null;
    for (let attempt = 0; attempt < 5 && !discount; attempt++) {
      const code = generateDiscountCode();
      const { data: inserted, error: insertError } = await supabase
        .from("user_discounts")
        .insert({
          user_id: user.id,
          offer_id: offer.id,
          discount_percent: offer.discount_percent,
          code
        })
        .select()
        .single();

      if (!insertError) {
        discount = inserted;
      } else if (insertError.code !== "23505") {
        throw insertError;
      }
    }

    if (!discount) {
      throw new Error("Impossible de générer un code unique, réessayez");
    }

    await supabase.from("coin_transactions").insert({
      user_id: user.id,
      amount: -offer.coin_cost,
      type: "discount_purchase",
      metadata: { offer_id: offer.id, discount_percent: offer.discount_percent }
    });

    return new Response(
      JSON.stringify({ ok: true, code: discount.code, discountPercent: discount.discount_percent, newBalance: newCoins }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers });
  }
});
