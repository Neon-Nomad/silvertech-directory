import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error("User not authenticated")
        }

        const { facilityId, priceId, returnUrl } = await req.json()

        if (!facilityId) {
            throw new Error("Missing facilityId")
        }

        // ... (ownership checks)

        // ... (customer creation)

        // Construct success/cancel URLs using the provided returnUrl
        // Ensure we handle existing query parameters correctly
        const successUrl = new URL(returnUrl || `${req.headers.get("origin")}/dashboard`);
        successUrl.searchParams.set('success', 'true');
        successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');

        const cancelUrl = new URL(returnUrl || `${req.headers.get("origin")}/dashboard`);
        cancelUrl.searchParams.set('canceled', 'true');

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId || 'price_featured_monthly',
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: successUrl.toString(),
            cancel_url: cancelUrl.toString(),
            metadata: {
                facility_id: facilityId,
                supabase_user_id: user.id
            }
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
