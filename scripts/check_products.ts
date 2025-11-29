import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    const { count, error } = await supabase
        .from('affiliate_products')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error checking products:', error.message);
    } else {
        console.log(`Found ${count} products in the database.`);
    }
}

checkProducts();
