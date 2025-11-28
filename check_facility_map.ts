
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacility() {
    const id = '1477ea45-3b4f-46df-bb2e-0c020f451130';
    console.log(`Checking facility: ${id}`);

    const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching facility:', error);
        return;
    }

    console.log('Facility Data:');
    console.log(`Name: ${data.name}`);
    console.log(`Address: ${data.address_line1}, ${data.city}, ${data.state}`);
    console.log(`Lat: ${data.latitude}, Lng: ${data.longitude}`);
    console.log(`Lat (alt): ${data.lat}, Lng (alt): ${data.lng}`);
}

checkFacility();
