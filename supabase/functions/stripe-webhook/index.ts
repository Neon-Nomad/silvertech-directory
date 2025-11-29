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
            const userId = session.metadata?.supabase_user_id
            const planId = session.metadata?.plan_id
            const slotCount = parseInt(session.metadata?.slot_count || "0")
            const subscriptionId = session.subscription

            console.log(`Checkout completed for user: ${userId}, plan: ${planId}`)

            if (userId && planId) {
                const { error } = await supabaseClient
                    .from("user_profiles")
                    .update({
                        plan: planId,
                        billing_status: "active",
                        stripe_subscription_id: subscriptionId,
                        facility_assignments_remaining: slotCount,
                    })
                    .eq("id", userId)

                if (error) {
                    console.error("Failed to update user profile:", error)
                } else {
                    console.log(`User ${userId} updated to plan ${planId} with ${slotCount} slots`)
                }
            }
            break
        }
        case "invoice.payment_failed": {
            const invoice = event.data.object
            const subscriptionId = invoice.subscription

            console.log(`Payment failed for subscription: ${subscriptionId}`)

            // Find user by subscription ID
            const { error } = await supabaseClient
                .from("user_profiles")
                .update({ billing_status: "past_due" })
                .eq("stripe_subscription_id", subscriptionId)

            if (error) {
                console.error("Failed to update billing status:", error)
            }
            break
        }
        case "customer.subscription.deleted": {
            const subscription = event.data.object
            const subscriptionId = subscription.id

            console.log(`Subscription deleted: ${subscriptionId}`)

            const { error } = await supabaseClient
                .from("user_profiles")
                .update({
                    plan: "free",
                    billing_status: "canceled",
                    stripe_subscription_id: null,
                    facility_assignments_remaining: 0,
                })
                .eq("stripe_subscription_id", subscriptionId)

            if (error) {
                console.error("Failed to update user profile:", error)
            }
            break
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    })
})
