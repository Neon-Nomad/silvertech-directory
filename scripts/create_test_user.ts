import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestUser() {
    const email = 'test_operator@example.com';
    const password = 'password123';

    console.log(`Creating test user: ${email}...`);

    // 1. Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    let userId;

    if (existingUser) {
        console.log('User already exists.');
        userId = existingUser.id;
    } else {
        // 2. Create user
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'operator' }
        });

        if (error) {
            console.error('Error creating user:', error);
            return;
        }
        userId = data.user.id;
        console.log('User created successfully.');
    }

    console.log(`\nUser ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);
}

createTestUser().catch(console.error);
