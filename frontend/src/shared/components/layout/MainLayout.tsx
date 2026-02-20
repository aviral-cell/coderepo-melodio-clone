import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PlayerBar } from "./PlayerBar";
import { QueuePanel } from "./QueuePanel";
import { useSidebar } from "@/shared/contexts/SidebarContext";

interface MainLayoutProps {
	children: ReactNode;
	initialSearchQuery?: string;
	showTopBar?: boolean;
}

export function MainLayout({
	children,
	initialSearchQuery,
	showTopBar = true,
}: MainLayoutProps) {
	const { isCollapsed } = useSidebar();

	return (
		<div className="min-h-screen bg-melodio-black">
			<Sidebar />
			<main
				className={cn(
					"pb-32 sm:pb-24 transition-all duration-300",
					isCollapsed ? "ml-20" : "ml-64"
				)}
			>
				{showTopBar && <TopBar initialQuery={initialSearchQuery} />}
				<div className="mx-auto max-w-screen-2xl px-2 lg:px-4 rounded-lg overflow-hidden">
					{children}
				</div>
			</main>
			<PlayerBar />
			<QueuePanel />
		</div>
	);
}
