import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature")
    const body = await req.text()
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")

    let event
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            webhookSecret!,
            undefined,
            cryptoProvider
        )
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object
            const facilityId = session.metadata?.facility_id
            const subscriptionId = session.subscription

            if (facilityId) {
                await supabaseClient
                    .from("facilities")
                    .update({
                        plan: "featured",
                        billing_status: "active",
                        stripe_subscription_id: subscriptionId,
                        plan_updated_at: new Date().toISOString(),
                    })
                    .eq("id", facilityId)
            }
            break
        }
        case "invoice.payment_failed": {
            const invoice = event.data.object
            const subscriptionId = invoice.subscription

            // Find facility by subscription ID
            await supabaseClient
                .from("facilities")
                .update({ billing_status: "past_due" })
                .eq("stripe_subscription_id", subscriptionId)
            break
        }
        case "customer.subscription.deleted": {
            const subscription = event.data.object
            const subscriptionId = subscription.id

            await supabaseClient
                .from("facilities")
                .update({
                    plan: "basic",
                    billing_status: "canceled",
                    stripe_subscription_id: null
                })
                .eq("stripe_subscription_id", subscriptionId)
            break
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    })
})
