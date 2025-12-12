import type { JSX } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import { Music } from "lucide-react";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import { ProtectedRoute } from "@/shared/components/common/ProtectedRoute";

function RootLayout(): JSX.Element {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Outlet />
		</div>
	);
}

function AuthLayout(): JSX.Element {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-hackify-dark-gray to-hackify-black px-4 py-8">
			<div className="mb-8 flex items-center gap-2">
				<Music className="h-10 w-10 text-hackify-green" />
				<span className="text-3xl font-bold text-white">Hackify</span>
			</div>
			<Outlet />
		</div>
	);
}

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

function NotFoundPage(): JSX.Element {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
			<p className="text-xl text-muted-foreground">Page not found</p>
		</div>
	);
}

export const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{
				index: true,
				element: (
					<ProtectedRoute>
						<HomePage />
					</ProtectedRoute>
				),
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
