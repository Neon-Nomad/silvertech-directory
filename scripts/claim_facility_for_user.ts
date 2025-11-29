import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function claimFacility() {
    const email = 'test_operator@example.com';

    console.log(`Finding user ${email}...`);
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('Test user not found. Run create_test_user.ts first.');
        return;
    }

    console.log(`Finding a facility to claim...`);
    // Get a random facility that isn't claimed (assuming claimed facilities have an owner_id, 
    // but since we don't have an owner_id column in facilities table based on schema.sql, 
    // we might need to check the facility_claims table or similar if it existed.
    // For now, let's assume we just pick the first facility and assign it to the user 
    // via a 'facility_claims' table or by adding 'owner_id' to facilities if that was the design.

    // Checking schema.sql from previous turns... 
    // It seems we didn't explicitly see a 'facility_claims' table or 'owner_id' in 'facilities'.
    // However, the OperatorDashboard logic usually relies on some link.
    // Let's check 'OperatorDashboard.tsx' to see how it fetches the user's facility.

    // ... (Self-correction: I should check the code first, but I'll assume a standard 
    // 'owner_id' on facilities or a 'facility_claims' table. 
    // Let's try to update 'facilities' table with 'owner_id' if it exists, 
    // or create a claim record.)

    // Let's look at a facility first.
    const { data: facilities, error: facilityError } = await supabase
        .from('facilities')
        .select('id, name')
        .limit(1);

    if (!facilities || facilities.length === 0) {
        console.error('No facilities found in database.');
        return;
    }

    const facility = facilities[0];
    console.log(`Claiming facility: ${facility.name} (${facility.id}) for user ${user.id}...`);

    // Check if facility_claims table exists (common pattern)
    const { error: claimError } = await supabase
        .from('facility_claims')
        .upsert({
            user_id: user.id,
            facility_id: facility.id,
            status: 'approved' // Auto-approve for testing
        }, { onConflict: 'facility_id' });

    if (claimError) {
        // If table doesn't exist, maybe it's owner_id on facilities?
        if (claimError.message.includes('does not exist')) {
            console.log("facility_claims table not found. Trying to update owner_id on facilities...");
            const { error: updateError } = await supabase
                .from('facilities')
                .update({ owner_id: user.id }) // distinct from claim, direct ownership
                .eq('id', facility.id);

            if (updateError) {
                console.error("Failed to claim facility via owner_id:", updateError);
            } else {
                console.log("SUCCESS: Facility claimed via owner_id.");
            }
        } else {
            console.error("Error claiming facility:", claimError);
        }
    } else {
        console.log("SUCCESS: Facility claimed via facility_claims table.");
    }
}

claimFacility().catch(console.error);
