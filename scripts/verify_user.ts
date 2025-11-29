import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyUser() {
    const email = 'test_operator@example.com';
    console.log(`Verifying user: ${email}...`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (user) {
        console.log('User FOUND.');
        console.log(`ID: ${user.id}`);
        console.log(`Email Confirmed At: ${user.email_confirmed_at}`);
        console.log(`Last Sign In: ${user.last_sign_in_at}`);
        console.log(`Role: ${user.role}`);
        console.log(`App Metadata:`, user.app_metadata);
        console.log(`User Metadata:`, user.user_metadata);
    } else {
        console.error('User NOT FOUND.');
    }
}

verifyUser().catch(console.error);
