'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/supabase/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
