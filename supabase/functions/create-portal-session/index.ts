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

        // Parse request body - no longer needs facilityId
        const { returnUrl } = await req.json()

        console.log(`Creating portal session for user: ${user.id}`)

        // Get user profile and customer ID
        const { data: profile, error: profileError } = await supabaseClient
            .from("user_profiles")
            .select("id, stripe_customer_id")
            .eq("id", user.id)
            .single()

        if (profileError || !profile) {
            throw new Error("User profile not found")
        }

        if (!profile.stripe_customer_id) {
            throw new Error("No billing information found. Please subscribe to a plan first.")
        }

        console.log(`Creating portal session for customer: ${profile.stripe_customer_id}`)

        // Create Stripe billing portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: returnUrl || `${req.headers.get("origin")}/dashboard`,
        })

        console.log(`Portal session created: ${session.id}`)

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        )
    } catch (error) {
        console.error("Portal session error:", error.message)
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
