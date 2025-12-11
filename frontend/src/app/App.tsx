import type { JSX } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Providers } from "./providers";

/**
 * Main Application component
 */
export function App(): JSX.Element {
	return (
		<Providers>
			<RouterProvider router={router} />
		</Providers>
	);
}
