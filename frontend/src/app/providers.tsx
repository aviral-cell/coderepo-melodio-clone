import type { JSX, ReactNode } from "react";
import { AuthProvider } from "@/shared/contexts/AuthContext";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
	return <AuthProvider>{children}</AuthProvider>;
}
