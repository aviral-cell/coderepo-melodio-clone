import type { JSX } from "react";
import { createBrowserRouter, Outlet } from "react-router";

/**
 * Root layout component
 * Provides consistent layout structure across all pages
 */
function RootLayout(): JSX.Element {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Outlet />
		</div>
	);
}

/**
 * Home page component (placeholder)
 */
function HomePage(): JSX.Element {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<h1 className="mb-4 text-4xl font-bold text-primary">
				Melodio Music Player
			</h1>
			<p className="text-muted-foreground">
				A modern music streaming application
			</p>
		</div>
	);
}

/**
 * Not Found page component
 */
function NotFoundPage(): JSX.Element {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
			<p className="text-xl text-muted-foreground">Page not found</p>
		</div>
	);
}

/**
 * Application router configuration
 */
export const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: "*",
				element: <NotFoundPage />,
			},
		],
	},
]);
