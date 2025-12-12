import type { JSX, ReactNode } from "react";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { SidebarProvider } from "@/shared/contexts/SidebarContext";
import { ToastProvider } from "@/shared/hooks/useToast";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
	return (
		<AuthProvider>
			<ToastProvider>
				<PlayerProvider>
					<SidebarProvider>{children}</SidebarProvider>
				</PlayerProvider>
			</ToastProvider>
		</AuthProvider>
	);
}
