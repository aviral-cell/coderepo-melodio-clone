import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Search, LogOut, User, Crown, Users } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { SearchDropdown } from "@/shared/components/common/SearchDropdown";
import { AccountSwitcher } from "@/shared/components/common/AccountSwitcher";
import { useAuth } from "@/shared/contexts/AuthContext";

interface TopBarProps {
	initialQuery?: string;
}

export function TopBar({ initialQuery = "" }: TopBarProps) {
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [searchQuery, setSearchQuery] = useState(initialQuery);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setIsDropdownOpen(searchQuery.trim().length > 0);
	}, [searchQuery]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("keydown", handleEscapeKey);
		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
		};
	}, []);

	const handleSearch = useCallback((e: React.FormEvent) => {
		e.preventDefault();
	}, []);

	const handleCloseDropdown = useCallback(() => {
		setIsDropdownOpen(false);
	}, []);

	const handleLogout = useCallback(async () => {
		logout();
		navigate("/login");
	}, [logout, navigate]);

	const userInitial =
		user?.displayName?.charAt(0).toUpperCase() ||
		user?.username?.charAt(0).toUpperCase() ||
		"U";

	return (
		<header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-melodio-black/95 px-3 md:px-6 backdrop-blur-sm">
			<div className="hidden md:block md:w-32" />

			<form onSubmit={handleSearch} className="flex-1 max-w-xl">
				<div ref={searchContainerRef} className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-melodio-text-subdued" />
					<Input
						type="text"
						placeholder="What do you want to play?"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-full border-0 bg-melodio-dark-gray py-2 pl-10 pr-4 text-sm text-white placeholder:text-melodio-text-subdued focus:ring-2 focus:ring-white"
					/>
					<SearchDropdown
						query={searchQuery}
						isOpen={isDropdownOpen}
						onClose={handleCloseDropdown}
					/>
				</div>
			</form>

			<div className="flex w-auto md:w-32 items-center justify-end ml-2 md:ml-0">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex items-center gap-2 rounded-full bg-melodio-dark-gray px-2 py-1 hover:bg-melodio-light-gray"
						>
							<div className="flex h-7 w-7 items-center justify-center rounded-full bg-melodio-green text-sm font-bold text-black">
								{userInitial}
							</div>
							<span className="hidden text-sm text-white sm:inline">
								{user?.displayName?.split(" ")[0] || "User"}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-56 border-melodio-light-gray bg-melodio-dark-gray"
					>
						<DropdownMenuLabel className="text-white">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4" />
								<span>{user?.displayName || "User"}</span>
							</div>
							<p className="mt-1 text-xs font-normal text-melodio-text-subdued">
								{user?.email}
							</p>
							{user?.subscriptionStatus === "premium" && (
								<div className="mt-1 flex items-center gap-1 text-xs text-yellow-500">
									<Crown className="h-3 w-3" />
									Premium
								</div>
							)}
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-melodio-light-gray" />
						<Link to="/subscription">
							<DropdownMenuItem
								className="cursor-pointer text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white focus:bg-melodio-light-gray focus:text-white"
								data-testid="topbar-subscription-link"
							>
								<Crown className="mr-2 h-4 w-4" />
								Subscription
							</DropdownMenuItem>
						</Link>
						<Link to="/settings/family">
							<DropdownMenuItem
								className="cursor-pointer text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white focus:bg-melodio-light-gray focus:text-white"
								data-testid="topbar-family-settings-link"
							>
								<Users className="mr-2 h-4 w-4" />
								Family Settings
							</DropdownMenuItem>
						</Link>
						<AccountSwitcher />
						<DropdownMenuSeparator className="bg-melodio-light-gray" />
						<DropdownMenuItem
							onClick={handleLogout}
							className="cursor-pointer text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white focus:bg-melodio-light-gray focus:text-white"
							data-testid="topbar-logout-btn"
						>
							<LogOut className="mr-2 h-4 w-4" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
