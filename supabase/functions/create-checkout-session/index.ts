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

// Plan configuration matching frontend pricing.ts
const PLAN_CONFIGS: Record<string, { slotCount: number; planId: string }> = {
    'price_featured_monthly': { slotCount: 3, planId: 'featured' },
    'price_priority_monthly': { slotCount: 10, planId: 'priority' },
    'price_leadsuite_monthly': { slotCount: 25, planId: 'lead_suite' },
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client with user's auth token
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        )

        // Verify user authentication
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error("User not authenticated")
        }

        // Parse request body - no longer requires facilityId
        const { priceId, returnUrl } = await req.json()

        if (!priceId) {
            throw new Error("Missing priceId")
        }

        // Get plan configuration
        const planConfig = PLAN_CONFIGS[priceId]
        if (!planConfig) {
            throw new Error("Invalid price ID")
        }

        console.log(`Processing checkout for user: ${user.id}, plan: ${planConfig.planId}`)

        // Get or create user profile
        const { data: profile, error: profileError } = await supabaseClient
            .from("user_profiles")
            .select("id, stripe_customer_id")
            .eq("id", user.id)
            .single()

        if (profileError || !profile) {
            throw new Error("User profile not found")
        }

        // Customer creation/retrieval logic
        let customerId = profile.stripe_customer_id

        if (!customerId) {
            console.log("Creating new Stripe customer...")
            // Create a new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                },
            })

            customerId = customer.id
            console.log(`Created Stripe customer: ${customerId}`)

            // Save the customer ID back to the user profile
            const { error: updateError } = await supabaseClient
                .from("user_profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id)

            if (updateError) {
                console.error("Failed to save customer ID:", updateError)
                // Continue anyway - we have the customer ID
            } else {
                console.log("Saved customer ID to user profile")
            }
        } else {
            console.log(`Using existing Stripe customer: ${customerId}`)
        }

        // Construct success/cancel URLs
        const successUrl = new URL(returnUrl || `${req.headers.get("origin")}/dashboard`);
        successUrl.searchParams.set('success', 'true');
        successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');

        const cancelUrl = new URL(returnUrl || `${req.headers.get("origin")}/dashboard`);
        cancelUrl.searchParams.set('canceled', 'true');

        console.log(`Creating checkout session for price: ${priceId}`)

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: successUrl.toString(),
            cancel_url: cancelUrl.toString(),
            metadata: {
                supabase_user_id: user.id,
                plan_id: planConfig.planId,
                slot_count: planConfig.slotCount.toString(),
            }
        })

        console.log(`Checkout session created: ${session.id}`)

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        )
    } catch (error) {
        console.error("Checkout session error:", error.message)
        return new Response(
            JSON.stringify({
                error: error.message,
                details: error.type || "unknown_error"
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        )
    }
})
