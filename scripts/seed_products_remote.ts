import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const productsPath = path.join(__dirname, '../src/data/products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const getRecommendationReason = (name: string, category: string) => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('grab bar')) return "Essential for stability and preventing common slips in wet areas.";
    if (lowerName.includes('toilet')) return "Improves bathroom safety and ease of use.";
    if (lowerName.includes('shower') || lowerName.includes('bath')) return "Reduces slip risks and makes bathing safer and more comfortable.";
    if (lowerName.includes('walker') || lowerName.includes('rollator')) return "Provides critical support and stability for maintaining mobility.";
    if (lowerName.includes('wheelchair') || lowerName.includes('chair')) return "Ensures comfortable and safe mobility for those with limited movement.";
    if (lowerName.includes('cane')) return "Offers extra balance support for safer walking.";
    if (lowerName.includes('bed')) return "Enhances comfort and safety during sleep and rest.";
    if (lowerName.includes('alarm') || lowerName.includes('sensor') || lowerName.includes('monitor')) return "Provides peace of mind by alerting caregivers to potential issues.";
    if (lowerName.includes('light')) return "Improves visibility to prevent trips and falls in dim areas.";
    if (lowerName.includes('utensil') || lowerName.includes('opener')) return "Makes dining and meal prep easier and more independent.";
    if (lowerName.includes('incontinence') || lowerName.includes('diaper')) return "Provides discreet protection and maintains dignity.";
    if (lowerName.includes('pill') || lowerName.includes('medication')) return "Helps manage medication schedules accurately and safely.";
    if (lowerName.includes('memory') || lowerName.includes('clock')) return "Aids orientation and helps manage daily routines.";
    if (lowerName.includes('shoe') || lowerName.includes('sock')) return "Makes dressing easier and safer.";
    if (lowerName.includes('ramp')) return "Improves accessibility for entering and exiting the home.";

    switch (category) {
        case 'bathroom': return "Increases safety and independence in the bathroom.";
        case 'mobility': return "Supports safe movement and prevents falls.";
        case 'bedroom': return "Ensures a safe and comfortable sleeping environment.";
        case 'kitchen': return "Promotes independence in the kitchen.";
        case 'monitoring': return "Keeps loved ones connected and safe.";
        case 'hygiene': return "Essential for maintaining personal hygiene and comfort.";
        case 'medical': return "Critical for monitoring and managing health at home.";
        case 'dementia': return "Supports cognitive function and reduces anxiety.";
        case 'daily-living': return "Simplifies everyday tasks for better quality of life.";
        case 'outdoor': return "Enables safe and active outdoor experiences.";
        default: return "Highly recommended for senior safety and comfort.";
    }
};

async function seedProducts() {
    console.log('Starting product seeding...');

    // Optional: Clear existing products to avoid duplicates if running multiple times
    // const { error: deleteError } = await supabase.from('affiliate_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // if (deleteError) console.error('Error clearing table:', deleteError);

    let count = 0;
    const rows = [];

    for (const [category, products] of Object.entries(productsData)) {
        // @ts-ignore
        products.forEach(product => {
            const reason = getRecommendationReason(product.name, category);
            const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const affiliateUrl = `https://affiliatelink.com/?product=${slug}`;
            const imageUrl = `https://images.silvertech.com/${slug}.jpg`;

            rows.push({
                name: product.name,
                category: category,
                affiliate_url: affiliateUrl,
                image_url: imageUrl,
                recommendation_reason: reason
            });
            count++;
        });
    }

    const { error } = await supabase.from('affiliate_products').insert(rows);

    if (error) {
        console.error('Error inserting products:', error);
    } else {
        console.log(`Successfully inserted ${count} products.`);
    }
}

seedProducts();
