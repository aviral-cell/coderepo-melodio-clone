import type { JSX, ReactNode } from "react";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { SidebarProvider } from "@/shared/contexts/SidebarContext";
import { LikedTracksProvider } from "@/shared/contexts/LikedTracksContext";
import { ToastProvider } from "@/shared/hooks/useToast";
import { Toaster } from "@/shared/components/ui/toaster";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
	return (
		<AuthProvider>
			<ToastProvider>
				<PlayerProvider>
					<SidebarProvider>
						<PlaylistProvider>
							<LikedTracksProvider>{children}</LikedTracksProvider>
						</PlaylistProvider>
					</SidebarProvider>
				</PlayerProvider>
				<Toaster />
			</ToastProvider>
		</AuthProvider>
	);
}
