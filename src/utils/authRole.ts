import type { User } from '@supabase/supabase-js';

export type AppRole = 'operator' | 'family' | 'unknown';

export const getUserRole = (user: User | null): AppRole => {
  if (!user) return 'unknown';

  const appRole = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null;
  const userRole = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : null;
  const role = (appRole || userRole || '').toLowerCase();

  if (role === 'operator') return 'operator';
  if (role === 'family') return 'family';
  return 'unknown';
};

export const isOperatorUser = (user: User | null): boolean => getUserRole(user) === 'operator';

