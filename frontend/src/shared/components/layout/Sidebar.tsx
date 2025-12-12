import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router";
import {
	Home,
	Library,
	Plus,
	Music,
	ChevronLeft,
	ChevronRight,
	Radio,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { CreatePlaylistDialog } from "@/shared/components/common/CreatePlaylistDialog";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useSidebar } from "@/shared/contexts/SidebarContext";
import { playlistsService } from "@/shared/services/playlist.service";
import type { Playlist } from "@/shared/types";

const navItems = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/genre", label: "Genre", icon: Radio },
];

export function Sidebar() {
	const location = useLocation();
	const pathname = location.pathname;
	const { isAuthenticated } = useAuth();
	const { isCollapsed, toggleSidebar } = useSidebar();

	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	const fetchPlaylists = useCallback(async () => {
		if (!isAuthenticated) {
			setIsLoading(false);
			return;
		}

		try {
			const response = await playlistsService.getAll();
			setPlaylists(response);
		} catch {
			// Silently fail - playlists will just be empty
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	useEffect(() => {
		fetchPlaylists();
	}, [fetchPlaylists]);

	const handlePlaylistCreated = (newPlaylist: Playlist) => {
		setPlaylists((prev) => [newPlaylist, ...prev]);
	};

	return (
		<>
			<aside
				className={cn(
					"fixed left-0 top-0 z-30 flex h-screen flex-col bg-black pb-[90px] transition-all duration-300",
					isCollapsed ? "w-20" : "w-64"
				)}
			>
				<div className="flex items-center justify-center p-4">
					<div
						className={cn(
							"flex items-center gap-2",
							isCollapsed && "justify-center w-full"
						)}
					>
						<Music className="h-8 w-8 text-hackify-green flex-shrink-0" />
						{!isCollapsed && (
							<span className="text-xl font-bold text-white">Hackify</span>
						)}
					</div>
				</div>

				<nav className="px-3 space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						return (
							<Link
								key={item.href}
								to={item.href}
								className={cn(
									"flex items-center gap-4 rounded-md px-3 py-3 text-sm font-semibold transition-colors",
									isActive
										? "text-white"
										: "text-hackify-text-subdued hover:text-white",
									isCollapsed && "justify-center px-2"
								)}
								title={isCollapsed ? item.label : undefined}
							>
								<Icon className="h-6 w-6 flex-shrink-0" />
								{!isCollapsed && item.label}
							</Link>
						);
					})}
				</nav>

				{/* Library section - hidden on mobile when collapsed */}
				<div
					className={cn(
						"mt-6 flex-1 overflow-hidden px-3",
						isCollapsed && "hidden md:block"
					)}
				>
					<div
						className={cn(
							"flex items-center px-3 py-2",
							isCollapsed ? "justify-center" : "justify-between"
						)}
					>
						<div
							className={cn(
								"flex items-center gap-2 text-hackify-text-subdued",
								isCollapsed && "justify-center"
							)}
						>
							<Library className="h-6 w-6 flex-shrink-0" />
							{!isCollapsed && (
								<span className="text-sm font-semibold">Your Library</span>
							)}
						</div>
						{!isCollapsed && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-hackify-text-subdued hover:text-white"
								onClick={() => setIsCreateDialogOpen(true)}
								aria-label="Create playlist"
							>
								<Plus className="h-4 w-4" />
							</Button>
						)}
					</div>

					<ScrollArea className="h-[calc(100vh-300px)]">
						<div className="space-y-1 p-2">
							{isLoading ? (
								Array.from({ length: 5 }).map((_, index) => (
									<div
										key={index}
										className={cn(
											"flex items-center gap-3 rounded-md p-2",
											isCollapsed && "justify-center"
										)}
									>
										<Skeleton className="h-12 w-12 rounded flex-shrink-0" />
										{!isCollapsed && (
											<div className="flex-1">
												<Skeleton className="mb-1 h-4 w-3/4" />
												<Skeleton className="h-3 w-1/2" />
											</div>
										)}
									</div>
								))
							) : playlists.length > 0 ? (
								playlists.map((playlist) => {
									const isActive = pathname === `/playlist/${playlist._id}`;
									const trackCount = Array.isArray(playlist.trackIds)
										? playlist.trackIds.length
										: 0;

									return (
										<Link
											key={playlist._id}
											to={`/playlist/${playlist._id}`}
											className={cn(
												"flex items-center gap-3 rounded-md p-2 transition-colors",
												isActive
													? "bg-hackify-light-gray"
													: "hover:bg-hackify-light-gray/50",
												isCollapsed && "justify-center"
											)}
											title={isCollapsed ? playlist.name : undefined}
										>
											<div className="flex h-12 w-12 items-center justify-center rounded bg-hackify-light-gray flex-shrink-0">
												<Music className="h-6 w-6 text-hackify-text-subdued" />
											</div>
											{!isCollapsed && (
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-white">
														{playlist.name}
													</p>
													<p className="truncate text-xs text-hackify-text-subdued">
														Playlist - {trackCount}{" "}
														{trackCount === 1 ? "track" : "tracks"}
													</p>
												</div>
											)}
										</Link>
									);
								})
							) : !isCollapsed ? (
								<div className="px-3 py-4 text-center">
									<p className="mb-2 text-sm font-semibold text-white">
										Create your first playlist
									</p>
									<p className="mb-4 text-xs text-hackify-text-subdued">
										It&apos;s easy, we&apos;ll help you
									</p>
									<Button
										size="sm"
										onClick={() => setIsCreateDialogOpen(true)}
										className="bg-white text-black hover:bg-gray-200"
									>
										Create playlist
									</Button>
								</div>
							) : null}
						</div>
					</ScrollArea>
				</div>

				{/* Collapse button at bottom-right */}
				<div className="mt-auto p-3">
					<div
						className={cn("flex", isCollapsed ? "justify-center" : "justify-end")}
					>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-hackify-text-subdued hover:text-white hover:bg-hackify-light-gray"
							onClick={toggleSidebar}
							aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						>
							{isCollapsed ? (
								<ChevronRight className="h-4 w-4" />
							) : (
								<ChevronLeft className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</aside>

			<CreatePlaylistDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onSuccess={handlePlaylistCreated}
			/>
		</>
	);
}
