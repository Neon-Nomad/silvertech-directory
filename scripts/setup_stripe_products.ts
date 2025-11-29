import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
});

async function setupStripe() {
    console.log('Setting up Stripe products...');

    // Check if "Premium Plan" exists
    const products = await stripe.products.search({
        query: "name:'Premium Plan'",
    });

    let priceId;

    if (products.data.length === 0) {
        console.log('Creating Premium Plan product...');
        const product = await stripe.products.create({
            name: 'Premium Plan',
            description: 'Unlock all features including photo uploads and featured listing.',
        });

        console.log('Creating Price for Premium Plan...');
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 29900, // $299.00
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
        });
        priceId = price.id;
    } else {
        console.log('Premium Plan product found.');
        const prices = await stripe.prices.list({
            product: products.data[0].id,
            active: true,
            limit: 1,
        });

        if (prices.data.length > 0) {
            priceId = prices.data[0].id;
        } else {
            // Create price if product exists but no price
            console.log('Creating Price for existing Premium Plan...');
            const price = await stripe.prices.create({
                product: products.data[0].id,
                unit_amount: 29900, // $299.00
                currency: 'usd',
                recurring: {
                    interval: 'month',
                },
            });
            priceId = price.id;
        }
    }

    console.log(`\nSUCCESS! Use this Price ID in your frontend: ${priceId}\n`);
}

setupStripe().catch(console.error);
