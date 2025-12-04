'use client';

import { AuthProvider } from '@/shared/contexts/AuthContext';
import { PlayerProvider } from '@/shared/contexts/PlayerContext';
import { Toaster } from '@/shared/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        {children}
        <Toaster />
      </PlayerProvider>
    </AuthProvider>
  );
}
