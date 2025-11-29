import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetPassword() {
    const email = 'test_operator@example.com';
    const newPassword = 'password123';

    console.log(`Resetting password for: ${email}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found.');
        return;
    }

    const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (error) {
        console.error('Error updating password:', error);
    } else {
        console.log('SUCCESS: Password updated to "password123"');
    }
}

resetPassword().catch(console.error);
