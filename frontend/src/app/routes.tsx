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
import SubscriptionPage from "@/pages/SubscriptionPage";
import FamilySettingsPage from "@/pages/FamilySettingsPage";
import { ProtectedRoute } from "@/shared/components/common/ProtectedRoute";
import { MainLayout } from "@/shared/components/layout/MainLayout";

function RootLayout(): JSX.Element {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Outlet />
		</div>
	);
}

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

function AppLayout(): JSX.Element {
	return (
		<ProtectedRoute>
			<MainLayout>
				<Outlet />
			</MainLayout>
		</ProtectedRoute>
	);
}

function NotFoundPage(): JSX.Element {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
			<p className="text-xl text-muted-foreground">Page not found</p>
		</div>
	);
}

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

export const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
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
					{
						path: "subscription",
						element: <SubscriptionPage />,
					},
					{
						path: "settings/family",
						element: <FamilySettingsPage />,
					},
				],
			},
			{
				path: "*",
				element: <NotFoundPage />,
			},
		],
	},
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
