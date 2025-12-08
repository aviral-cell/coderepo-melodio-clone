'use client';

import { AuthProvider } from '@/shared/contexts/AuthContext';
import { PlayerProvider } from '@/shared/contexts/PlayerContext';
import { SidebarProvider } from '@/shared/contexts/SidebarContext';
import { Toaster } from '@/shared/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <SidebarProvider>
          {children}
          <Toaster />
        </SidebarProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
