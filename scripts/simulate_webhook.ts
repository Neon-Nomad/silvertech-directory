import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia', // Updated to match a recent version, or use '2022-11-15' as in the function
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!webhookSecret || !supabaseUrl) {
    console.error('Missing STRIPE_WEBHOOK_SECRET or VITE_SUPABASE_URL in .env');
    process.exit(1);
}

const functionUrl = `${supabaseUrl}/functions/v1/stripe-webhook`;

async function simulateWebhook() {
    console.log('Simulating Stripe Webhook...');
    console.log(`Target URL: ${functionUrl}`);

    // Create a mock payload
    const payload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'cs_test_session',
                object: 'checkout.session',
                subscription: 'sub_test_123',
                metadata: {
                    facility_id: 'test_facility_id', // We might need a real ID to see DB updates, but for now checking 200 OK is good
                },
                customer: 'cus_test_123',
            },
        },
    };

    const payloadString = JSON.stringify(payload, null, 2);

    // Generate signature
    const header = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: webhookSecret!,
    });

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': header,
            },
            body: payloadString,
        });

        const responseText = await response.text();

        console.log(`Response Status: ${response.status}`);
        console.log(`Response Body: ${responseText}`);

        if (response.ok) {
            console.log('✅ Webhook simulation successful!');
        } else {
            console.error('❌ Webhook simulation failed.');
        }
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

simulateWebhook();
