import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    const { code } = await req.json(); 

    if (!authHeader || !code) {
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

    const normalizedCode = String(code).trim().toUpperCase();

    const { data: discount } = await supabase
      .from("user_discounts")
      .select("*")
      .eq("code", normalizedCode)
      .eq("user_id", user.id)
      .eq("is_used", false)
      .maybeSingle();

    if (!discount) {
      return new Response(JSON.stringify({ ok: true, found: false }), { status: 200, headers });
    }

    const { error: updateDiscountError } = await supabase
      .from("user_discounts")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", discount.id);

    if (updateDiscountError) throw updateDiscountError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ active_discount_percent: discount.discount_percent })
      .eq("id", user.id);

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({ ok: true, found: true, discountPercent: discount.discount_percent }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers });
  }
});
