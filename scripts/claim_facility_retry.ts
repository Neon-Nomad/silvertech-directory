import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function claimFacilityRetry() {
    const email = 'test_operator@example.com';

    // Get user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) return console.error('User not found');

    // Get facility
    const { data: facilities } = await supabase.from('facilities').select('id, name').limit(1);
    if (!facilities || facilities.length === 0) return console.error('No facilities found');
    const facility = facilities[0];

    console.log(`Attempting to claim ${facility.name} for ${user.email}...`);

    // Try insert directly
    const { error } = await supabase
        .from('facility_claims')
        .insert({
            user_id: user.id,
            facility_id: facility.id,
            status: 'approved'
        });

    if (error) {
        console.error('Insert error:', error.message);
        // If duplicate, that's fine for testing
    } else {
        console.log('SUCCESS: Facility claimed.');
    }
}

claimFacilityRetry().catch(console.error);
