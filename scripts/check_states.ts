import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStates() {
    // We can't use .distinct() directly easily on all columns with select('state'), 
    // but we can fetch all and process in JS for a quick check, or use a rpc if available.
    // For now, fetching 'state' only is lightweight enough.
    const { data, error } = await supabase
        .from('facilities')
        .select('state')
        .limit(10000);

    if (error) {
        console.error('Error fetching states:', error);
        return;
    }

    const stateCounts: Record<string, number> = {};
    data.forEach(f => {
        const s = f.state ? f.state.trim().toUpperCase() : 'UNKNOWN';
        stateCounts[s] = (stateCounts[s] || 0) + 1;
    });

    const states = Object.keys(stateCounts).sort();

    console.log(`Total Distinct States: ${states.length}`);
    console.log('----------------------------------------');
    states.forEach(state => {
        console.log(`${state}: ${stateCounts[state]} facilities`);
    });
    const { data: recent, error: recentError } = await supabase
        .from('facilities')
        .select('name, state, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (recentError) {
        console.error('Error fetching recent:', recentError);
    } else {
        console.log('\nMost Recent Facilities:');
        recent.forEach(f => console.log(`${f.name} (${f.state}) - ${f.created_at}`));
    }
    console.log(`Total records fetched: ${data.length}`);

    const { count: ncCount, error: ncError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'NC');

    if (ncError) console.error('Error counting NC:', ncError);
    else console.log(`Total NC facilities in DB: ${ncCount}`);

    const { count: flCount, error: flError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'FL');

    if (flError) console.error('Error counting FL:', flError);
    else console.log(`Total FL facilities in DB: ${flCount}`);

    const newStates = ['IA', 'KY', 'LA', 'MI', 'MT'];
    for (const state of newStates) {
        const { count, error } = await supabase
            .from('facilities')
            .select('*', { count: 'exact', head: true })
            .eq('state', state);

        if (error) console.error(`Error counting ${state}:`, error);
        else console.log(`Total ${state} facilities in DB: ${count}`);
    }
}

checkStates();
