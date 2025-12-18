'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/supabase/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function Providers({ children }: { children: ReactNode }) {
  // Only wrap with AuthProvider if Supabase is configured
  if (!isSupabaseConfigured()) {
    return <>{children}</>;
  }
  return <AuthProvider>{children}</AuthProvider>;
}
