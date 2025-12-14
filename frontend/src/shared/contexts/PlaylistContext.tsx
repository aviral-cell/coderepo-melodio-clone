import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";

interface PlaylistContextType {
	refreshTrigger: number;
	triggerRefresh: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

interface PlaylistProviderProps {
	children: ReactNode;
}

export function PlaylistProvider({ children }: PlaylistProviderProps) {
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const triggerRefresh = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	return (
		<PlaylistContext.Provider value={{ refreshTrigger, triggerRefresh }}>
			{children}
		</PlaylistContext.Provider>
	);
}

export function usePlaylistRefresh(): PlaylistContextType {
	const context = useContext(PlaylistContext);
	if (!context) {
		throw new Error("usePlaylistRefresh must be used within a PlaylistProvider");
	}
	return context;
}
