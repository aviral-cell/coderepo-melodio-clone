import type { JSX } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import { Music } from "lucide-react";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import HomePage from "@/pages/HomePage";
import GenrePage from "@/pages/GenrePage";
import AlbumDetailPage from "@/pages/AlbumDetailPage";
import TrackDetailPage from "@/pages/TrackDetailPage";
import PlaylistDetailPage from "@/pages/PlaylistDetailPage";
import { ProtectedRoute } from "@/shared/components/common/ProtectedRoute";
import { MainLayout } from "@/shared/components/layout/MainLayout";

/**
 * RootLayout - Base layout wrapper for all routes.
 * Provides consistent background styling.
 */
function RootLayout(): JSX.Element {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Outlet />
		</div>
	);
}

/**
 * AuthLayout - Layout for authentication pages (login/register).
 * Displays centered content with app branding.
 */
function AuthLayout(): JSX.Element {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-melodio-dark-gray to-melodio-black px-4 py-8">
			<div className="mb-8 flex items-center gap-2">
				<Music className="h-10 w-10 text-melodio-green" />
				<span className="text-3xl font-bold text-white">Melodio</span>
			</div>
			<Outlet />
		</div>
	);
}

/**
 * AppLayout - Layout for authenticated app pages.
 * Wraps content with MainLayout (Sidebar, TopBar, PlayerBar, QueuePanel).
 */
function AppLayout(): JSX.Element {
	return (
		<ProtectedRoute>
			<MainLayout>
				<Outlet />
			</MainLayout>
		</ProtectedRoute>
	);
}

/**
 * NotFoundPage - 404 error page.
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
 * Placeholder pages for routes not yet implemented.
 */
function SearchPage(): JSX.Element {
	return (
		<div className="p-6">
			<h1 className="text-3xl font-bold text-white">Search</h1>
			<p className="mt-2 text-melodio-light-gray">Search for music</p>
		</div>
	);
}

function LibraryPage(): JSX.Element {
	return (
		<div className="p-6">
			<h1 className="text-3xl font-bold text-white">Your Library</h1>
			<p className="mt-2 text-melodio-light-gray">Your saved music</p>
		</div>
	);
}

/**
 * Application router configuration.
 *
 * Route structure:
 * - /login, /register -> AuthLayout (no sidebar)
 * - / (protected) -> MainLayout with Sidebar, TopBar, PlayerBar
 * - /genre (protected) -> MainLayout
 * - /playlist/:id (protected) -> MainLayout
 * - /album/:id (protected) -> MainLayout
 * - /track/:id (protected) -> MainLayout
 * - /search (protected) -> MainLayout
 * - /library (protected) -> MainLayout
 */
export const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			// Protected app routes with MainLayout
			{
				element: <AppLayout />,
				children: [
					{
						index: true,
						element: <HomePage />,
					},
					{
						path: "genre",
						element: <GenrePage />,
					},
					{
						path: "playlist/:id",
						element: <PlaylistDetailPage />,
					},
					{
						path: "album/:id",
						element: <AlbumDetailPage />,
					},
					{
						path: "track/:id",
						element: <TrackDetailPage />,
					},
					{
						path: "search",
						element: <SearchPage />,
					},
					{
						path: "library",
						element: <LibraryPage />,
					},
				],
			},
			// 404 fallback
			{
				path: "*",
				element: <NotFoundPage />,
			},
		],
	},
	// Auth routes (outside RootLayout to have different styling)
	{
		element: <AuthLayout />,
		children: [
			{
				path: "/login",
				element: <LoginPage />,
			},
			{
				path: "/register",
				element: <RegisterPage />,
			},
		],
	},
]);
