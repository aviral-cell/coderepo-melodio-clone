import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-melodio-black">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-melodio-green border-t-transparent" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <>{children}</>;
}
