import type { JSX, ReactNode } from "react";

interface ProvidersProps {
	children: ReactNode;
}

/**
 * Application providers wrapper
 * Wraps the app with necessary context providers
 *
 * Add providers here as needed:
 * - AuthProvider
 * - PlayerProvider
 * - ThemeProvider
 * - etc.
 */
export function Providers({ children }: ProvidersProps): JSX.Element {
	return (
		<>
			{/* Add providers here as needed */}
			{children}
		</>
	);
}
