'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/supabase/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { ThemeProvider } from '@/components/ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  // Only wrap with AuthProvider if Supabase is configured
  if (!isSupabaseConfigured()) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
