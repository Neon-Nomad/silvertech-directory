import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { getUserRole, isOperatorUser, type AppRole } from '@/src/utils/authRole';
import { requestWelcomeEmail } from '@/features/auth/sendWelcomeEmail';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole;
  isOperator: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: 'unknown',
  isOperator: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Only a real sign-in asks for the welcome email. The server sends it at most once per account.
      if (event === 'SIGNED_IN' && session?.access_token) {
        requestWelcomeEmail(session.access_token).catch((err) => console.error('Welcome email request failed:', err));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    role: getUserRole(user),
    isOperator: isOperatorUser(user),
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
