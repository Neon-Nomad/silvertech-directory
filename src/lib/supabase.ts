import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

// Captured before the client reads and clears the URL. The reset page needs the recovery token or error from it.
export const authRedirectHash = typeof window !== 'undefined' ? window.location.hash : '';

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
