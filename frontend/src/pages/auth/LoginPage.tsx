import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { useAuth } from "@/shared/contexts/AuthContext";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			await login({ email, password });
			navigate("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full max-w-md border-melodio-light-gray bg-melodio-dark-gray">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl text-white">Log in to Melodio</CardTitle>
				<CardDescription>Enter your credentials to continue</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium text-white">
							Email address
						</label>
						<Input
							id="email"
							type="email"
							placeholder="name@melodio.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="bg-melodio-light-gray"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium text-white">
							Password
						</label>
						<Input
							id="password"
							type="password"
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="bg-melodio-light-gray"
						/>
					</div>

					<Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
						{isSubmitting ? "Logging in..." : "Log In"}
					</Button>
				</form>

				<div className="mt-6 text-center">
					<span className="text-sm text-melodio-text-subdued">
						Don&apos;t have an account?{" "}
					</span>
					<Link
						to="/register"
						className="text-sm font-semibold text-white underline-offset-4 hover:underline"
					>
						Sign up for Melodio
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
