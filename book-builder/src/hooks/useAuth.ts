'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { LQ21Profile } from '@/lib/supabase/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LQ21Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isConfigured = isSupabaseConfigured();
  const supabase = useMemo(() => {
    if (!isConfigured) return null;
    return getSupabaseClient();
  }, [isConfigured]);

  // Fetch user profile from LQ21_profiles
  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;
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
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session with timeout to prevent infinite loading
    const getInitialSession = async () => {
      try {
        // Race between actual session fetch and 5s timeout
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => {
              console.warn('useAuth: Session check timed out after 5s');
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
        console.error('useAuth: Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

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
  }, [supabase, fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    return { data, error };
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  return {
    user,
    profile,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
    isConfigured,
  };
}
