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
					"pb-24 transition-all duration-300",
					isCollapsed ? "ml-20" : "ml-64"
				)}
			>
				{showTopBar && <TopBar initialQuery={initialSearchQuery} />}
				{children}
			</main>
			<PlayerBar />
			<QueuePanel />
		</div>
	);
}
