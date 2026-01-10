'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './client';
import { LQ21Profile } from './types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: LQ21Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<LQ21Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  // Only get Supabase client if configured
  const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;

  // Fetch user profile from LQ21_profiles
  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('lq21_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      // Return null if no profile exists (user hasn't created one yet)
      return data as LQ21Profile | null;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initRef.current) return;
    initRef.current = true;

    // If Supabase isn't configured, stop loading immediately
    if (!supabase) {
      console.warn('Supabase not configured - auth disabled');
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Get initial session with 5 second timeout
        // Timeout resolves with null session instead of rejecting to avoid error overlays
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => {
              console.warn('Auth session check timed out after 5s - continuing without auth');
              resolve({ data: { session: null } });
            }, 5000)
          ),
        ]);

        const session = result.data.session;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Continue without auth on error
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const signInWithGitHub = async () => {
    if (!supabase) return { error: new Error('Auth not configured') };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'repo user',
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: new Error('Auth not configured') };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGitHub,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
