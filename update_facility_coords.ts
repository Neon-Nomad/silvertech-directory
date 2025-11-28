
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

async function updateFacility() {
    const id = '1477ea45-3b4f-46df-bb2e-0c020f451130';
    const lat = 39.9125;
    const lng = -86.1875;

    console.log(`Updating facility: ${id} with lat: ${lat}, lng: ${lng}`);

    const { data, error } = await supabase
        .from('facilities')
        .update({ latitude: lat, longitude: lng })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating facility:', error);
        return;
    }

    console.log('Update successful:', data);
}

updateFacility();
