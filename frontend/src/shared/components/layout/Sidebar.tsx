import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router";
import {
	Home,
	Library,
	Plus,
	Music,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ChevronDown,
	Radio,
	Crown,
	Users,
	History,
	Headphones,
	Smile,
	Compass,
	Disc3,
	CalendarDays,
	ThumbsUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { CreatePlaylistDialog } from "@/shared/components/common/CreatePlaylistDialog";
import { useAuth } from "@/shared/contexts/AuthContext";
import { usePlaylistRefresh } from "@/shared/contexts/PlaylistContext";
import { useSidebar } from "@/shared/contexts/SidebarContext";
import { playlistsService } from "@/shared/services/playlist.service";
import type { Playlist } from "@/shared/types";

interface NavItem {
	href: string;
	label: string;
	icon: typeof Home;
	testId?: string;
}

interface NavGroup {
	key: string;
	label: string;
	icon: typeof Home;
	items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
	{
		key: "browse",
		label: "Browse",
		icon: Compass,
		items: [
			{ href: "/", label: "Home", icon: Home },
			{ href: "/genre", label: "Genre", icon: Radio },
			{ href: "/discover", label: "Discover", icon: Compass },
		],
	},
	{
		key: "experience",
		label: "Experience",
		icon: Headphones,
		items: [
			{ href: "/podcasts", label: "Podcasts", icon: Headphones },
			{ href: "/mood", label: "Mood Mixer", icon: Smile },
			{ href: "/mix", label: "Mix", icon: Disc3 },
			{ href: "/concerts", label: "Concerts", icon: CalendarDays },
		],
	},
	{
		key: "personal",
		label: "Personal",
		icon: Crown,
		items: [
			{ href: "/subscription", label: "Subscription", icon: Crown, testId: "sidebar-subscription-link" },
			{ href: "/settings/family", label: "Family", icon: Users, testId: "sidebar-family-link" },
			{ href: "/liked", label: "Liked Tracks", icon: ThumbsUp, testId: "sidebar-liked-tracks-link" },
			{ href: "/recently-played", label: "Recently Played", icon: History, testId: "sidebar-recently-played-link" },
		],
	},
];

const STORAGE_KEY_PREFIX = "melodio-nav-group-";

function getGroupExpandedDefault(): Record<string, boolean> {
	const defaults: Record<string, boolean> = {};
	for (const group of NAV_GROUPS) {
		const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${group.key}`);
		defaults[group.key] = stored === null ? true : stored === "true";
	}
	const libStored = localStorage.getItem(`${STORAGE_KEY_PREFIX}library`);
	defaults.library = libStored === null ? true : libStored === "true";
	return defaults;
}

export function Sidebar() {
	const location = useLocation();
	const pathname = location.pathname;
	const { isAuthenticated, user } = useAuth();
	const isPremium = user?.subscriptionStatus === "premium";
	const { isCollapsed, toggleSidebar } = useSidebar();
	const { refreshTrigger } = usePlaylistRefresh();

	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [openDrawer, setOpenDrawer] = useState<string | null>(null);
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(getGroupExpandedDefault);

	const toggleGroup = useCallback((groupKey: string) => {
		setExpandedGroups((prev) => {
			const next = { ...prev, [groupKey]: !prev[groupKey] };
			localStorage.setItem(`${STORAGE_KEY_PREFIX}${groupKey}`, String(next[groupKey]));
			return next;
		});
	}, []);

	const fetchPlaylists = useCallback(async () => {
		if (!isAuthenticated) {
			setIsLoading(false);
			return;
		}

		try {
			const response = await playlistsService.getAll();
			setPlaylists(response);
		} catch {
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	useEffect(() => {
		fetchPlaylists();
	}, [fetchPlaylists, refreshTrigger]);

	const handlePlaylistCreated = (newPlaylist: Playlist) => {
		setPlaylists((prev) => [newPlaylist, ...prev]);
	};

	const renderNavLink = (item: NavItem, inDrawer = false) => {
		const Icon = item.icon;
		const isActive = pathname === item.href;

		let label: React.ReactNode = item.label;
		if (item.href === "/subscription" && isPremium) {
			label = (
				<span className="flex items-center gap-2">
					Subscription
					<span className="rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500">
						PRO
					</span>
				</span>
			);
		}

		return (
			<Link
				key={item.href}
				to={item.href}
				onClick={inDrawer ? () => setOpenDrawer(null) : undefined}
				className={cn(
					"flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
					isActive
						? "text-white bg-melodio-light-gray/50"
						: "text-melodio-text-subdued hover:text-white hover:bg-melodio-light-gray/30",
				)}
				data-testid={item.testId}
			>
				<Icon className={cn("h-5 w-5 flex-shrink-0", item.href === "/subscription" && isPremium && "text-yellow-500")} />
				{label}
			</Link>
		);
	};

	const renderExpandedNavLink = (item: NavItem) => {
		const Icon = item.icon;
		const isActive = pathname === item.href;

		let label: React.ReactNode = item.label;
		if (item.href === "/subscription" && !isCollapsed && isPremium) {
			label = (
				<span className="flex items-center gap-2">
					Subscription
					<span className="rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500">
						PRO
					</span>
				</span>
			);
		}

		return (
			<Link
				key={item.href}
				to={item.href}
				className={cn(
					"flex items-center gap-4 rounded-md px-2 py-2 text-sm font-semibold transition-colors",
					isActive
						? "text-white"
						: "text-melodio-text-subdued hover:text-white",
				)}
				data-testid={item.testId}
			>
				<Icon className={cn("h-6 w-6 flex-shrink-0", item.href === "/subscription" && isPremium && "text-yellow-500")} />
				{label}
			</Link>
		);
	};

	const renderGroupHeader = (groupKey: string, label: string) => {
		const isExpanded = expandedGroups[groupKey] ?? true;
		return (
			<button
				type="button"
				onClick={() => toggleGroup(groupKey)}
				className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-melodio-text-subdued/60 hover:text-melodio-text-subdued cursor-pointer transition-colors"
			>
				<span>{label}</span>
				{isExpanded ? (
					<ChevronUp className="h-3 w-3" />
				) : (
					<ChevronDown className="h-3 w-3" />
				)}
			</button>
		);
	};

	const renderNavGroup = (group: NavGroup) => {
		const isExpanded = expandedGroups[group.key] ?? true;
		return (
			<div key={group.key}>
				{renderGroupHeader(group.key, group.label)}
				{isExpanded && (
					<div className="space-y-0.5">
						{group.items.map((item) => renderExpandedNavLink(item))}
					</div>
				)}
			</div>
		);
	};

	const renderCollapsedSectionButton = (group: NavGroup) => {
		const SectionIcon = group.icon;
		const hasActiveRoute = group.items.some((item) => pathname === item.href);

		return (
			<button
				key={group.key}
				type="button"
				onClick={() => setOpenDrawer(group.key)}
				className={cn(
					"flex w-full items-center justify-center rounded-md px-2 py-3 transition-colors cursor-pointer",
					hasActiveRoute
						? "text-white"
						: "text-melodio-text-subdued hover:text-white"
				)}
				title={group.label}
			>
				<SectionIcon className="h-6 w-6 flex-shrink-0" />
			</button>
		);
	};

	const isLibraryExpanded = expandedGroups.library ?? true;

	const activeDrawerGroup = NAV_GROUPS.find((g) => g.key === openDrawer);

	return (
		<>
			<aside
				className={cn(
					"fixed left-0 top-0 z-30 flex h-screen flex-col bg-black pb-[120px] sm:pb-[90px] transition-all duration-300",
					isCollapsed ? "w-20" : "w-64"
				)}
			>
				<div className="flex items-center justify-center p-4 flex-shrink-0">
					<Link
						to="/"
						className={cn(
							"flex items-center gap-2 transition-opacity hover:opacity-80",
							isCollapsed && "justify-center w-full"
						)}
					>
						<Music className="h-8 w-8 text-melodio-green flex-shrink-0" />
						{!isCollapsed && (
							<span className="text-xl font-bold text-white">Melodio</span>
						)}
					</Link>
				</div>

				{isCollapsed ? (
					<nav className="flex-shrink-0 px-3 space-y-1">
						{NAV_GROUPS.map(renderCollapsedSectionButton)}
						<button
							type="button"
							onClick={() => setOpenDrawer("library")}
							className={cn(
								"flex w-full items-center justify-center rounded-md px-2 py-3 transition-colors cursor-pointer",
								pathname.startsWith("/playlist/")
									? "text-white"
									: "text-melodio-text-subdued hover:text-white"
							)}
							title="Your Library"
						>
							<Library className="h-6 w-6 flex-shrink-0" />
						</button>
					</nav>
				) : (
					<ScrollArea className="flex-1 min-h-0 [&_[data-radix-scroll-area-viewport]>div]:!block [&_[data-radix-scroll-area-scrollbar]]:w-0.5">
						<nav className="px-3 space-y-3">
							{NAV_GROUPS.map(renderNavGroup)}
						</nav>

						<div className="px-3 mt-3">
							<div className="flex items-center px-2 py-1.5 justify-between">
								<button
									type="button"
									onClick={() => toggleGroup("library")}
									className="flex flex-1 items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-melodio-text-subdued/60 hover:text-melodio-text-subdued cursor-pointer transition-colors"
								>
									<span className="flex items-center gap-2">
										<Library className="h-4 w-4 flex-shrink-0" />
										Your Library
									</span>
									<div className="flex items-center gap-1">
										{isLibraryExpanded ? (
											<ChevronUp className="h-3 w-3" />
										) : (
											<ChevronDown className="h-3 w-3" />
										)}
									</div>
								</button>
								<Button
									variant="ghost"
									size="icon"
									className="ml-1 h-6 w-6 rounded-full text-melodio-text-subdued hover:text-white"
									onClick={() => setIsCreateDialogOpen(true)}
									aria-label="Create playlist"
								>
									<Plus className="h-3.5 w-3.5" />
								</Button>
							</div>

							{isLibraryExpanded && (
								<div className="space-y-1 p-2">
									{isLoading ? (
										Array.from({ length: 5 }).map((_, index) => (
											<div
												key={index}
												className="flex items-center gap-3 rounded-md p-2"
											>
												<Skeleton className="h-12 w-12 rounded flex-shrink-0" />
												<div className="flex-1">
													<Skeleton className="mb-1 h-4 w-3/4" />
													<Skeleton className="h-3 w-1/2" />
												</div>
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
														"flex items-center gap-3 rounded-md p-2 transition-colors min-w-0",
														isActive
															? "bg-melodio-light-gray"
															: "hover:bg-melodio-light-gray/50",
													)}
												>
													<div className="flex h-12 w-12 items-center justify-center rounded bg-melodio-light-gray flex-shrink-0">
														<Music className="h-6 w-6 text-melodio-text-subdued" />
													</div>
													<div className="min-w-0 flex-1 overflow-hidden">
														<p className="line-clamp-2 break-all text-sm font-medium text-white">
															{playlist.name}
														</p>
														<p className="truncate text-xs text-melodio-text-subdued">
															Playlist - {trackCount}{" "}
															{trackCount === 1 ? "track" : "tracks"}
														</p>
													</div>
												</Link>
											);
										})
									) : (
										<div className="px-3 py-4 text-center">
											<p className="mb-2 text-sm font-semibold text-white">
												Create your first playlist
											</p>
											<p className="mb-4 text-xs text-melodio-text-subdued">
												It&apos;s easy, we&apos;ll help you
											</p>
											<Button
												size="sm"
												onClick={() => setIsCreateDialogOpen(true)}
												className="rounded-full bg-white text-black hover:bg-gray-200"
											>
												Create playlist
											</Button>
										</div>
									)}
								</div>
							)}
						</div>
					</ScrollArea>
				)}

				<div className="mt-auto p-3 hidden">
					<div
						className={cn("flex", isCollapsed ? "justify-center" : "justify-end")}
					>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-full text-melodio-text-subdued hover:text-white hover:bg-melodio-light-gray"
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

			{/* Nav section drawers (Browse, Experience, Personal) */}
			<Sheet open={activeDrawerGroup !== undefined} onOpenChange={(open) => !open && setOpenDrawer(null)}>
				<SheetContent side="left" className="w-[280px] p-0">
					{activeDrawerGroup && (
						<>
							<SheetHeader className="p-4 border-b border-melodio-light-gray">
								<SheetTitle className="flex items-center gap-2">
									<activeDrawerGroup.icon className="h-5 w-5" />
									{activeDrawerGroup.label}
								</SheetTitle>
							</SheetHeader>
							<div className="space-y-1 p-3">
								{activeDrawerGroup.items.map((item) => renderNavLink(item, true))}
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>

			{/* Library drawer */}
			<Sheet open={openDrawer === "library"} onOpenChange={(open) => !open && setOpenDrawer(null)}>
				<SheetContent side="left" className="w-[280px] p-0">
					<SheetHeader className="p-4 border-b border-melodio-light-gray">
						<SheetTitle className="flex items-center gap-2">
							<Library className="h-5 w-5" />
							Your Library
						</SheetTitle>
					</SheetHeader>
					<ScrollArea className="h-[calc(100vh-80px)] [&_[data-radix-scroll-area-viewport]>div]:!block">
						<div className="space-y-1 p-2">
							{isLoading ? (
								Array.from({ length: 5 }).map((_, index) => (
									<div key={index} className="flex items-center gap-3 rounded-md p-2">
										<Skeleton className="h-12 w-12 rounded flex-shrink-0" />
										<div className="flex-1">
											<Skeleton className="mb-1 h-4 w-3/4" />
											<Skeleton className="h-3 w-1/2" />
										</div>
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
											onClick={() => setOpenDrawer(null)}
											className={cn(
												"flex items-center gap-3 rounded-md p-2 transition-colors min-w-0",
												isActive
													? "bg-melodio-light-gray"
													: "hover:bg-melodio-light-gray/50"
											)}
										>
											<div className="flex h-12 w-12 items-center justify-center rounded bg-melodio-light-gray flex-shrink-0">
												<Music className="h-6 w-6 text-melodio-text-subdued" />
											</div>
											<div className="min-w-0 flex-1 overflow-hidden">
												<p className="line-clamp-2 break-all text-sm font-medium text-white">
													{playlist.name}
												</p>
												<p className="truncate text-xs text-melodio-text-subdued">
													Playlist - {trackCount}{" "}
													{trackCount === 1 ? "track" : "tracks"}
												</p>
											</div>
										</Link>
									);
								})
							) : (
								<div className="px-3 py-4 text-center">
									<p className="mb-2 text-sm font-semibold text-white">
										Create your first playlist
									</p>
									<p className="mb-4 text-xs text-melodio-text-subdued">
										It&apos;s easy, we&apos;ll help you
									</p>
									<Button
										size="sm"
										onClick={() => {
											setOpenDrawer(null);
											setIsCreateDialogOpen(true);
										}}
										className="rounded-full bg-white text-black hover:bg-gray-200"
									>
										Create playlist
									</Button>
								</div>
							)}
						</div>
					</ScrollArea>
				</SheetContent>
			</Sheet>
		</>
	);
}
