'use client';

import { useAuth as useAuthContext } from '@/lib/supabase/auth-context';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Convenience hook that wraps AuthContext and provides additional auth methods.
 * All state comes from the single AuthProvider to avoid duplicate getSession calls.
 */
export function useAuth() {
  const context = useAuthContext();
  const isConfigured = isSupabaseConfigured();

  const signInWithEmail = async (email: string, password: string) => {
    const result = await context.signIn(email, password);
    return { data: result.error ? null : {}, error: result.error };
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const result = await context.signUp(email, password, displayName);
    return { data: result.error ? null : {}, error: result.error };
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (!isConfigured) return { data: null, error: new Error('Supabase not configured') };
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await context.signOut();
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) return { data: null, error: new Error('Supabase not configured') };
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  return {
    user: context.user,
    profile: context.profile,
    session: context.session,
    loading: context.loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPassword,
    isAuthenticated: !!context.user,
    isConfigured,
  };
}
