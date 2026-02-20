import { useState, useEffect, useMemo } from "react";
import { tracksService } from "@/shared/services";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import {
	AVAILABLE_MOODS,
	getTracksForMood,
	getTracksGroupedByMood,
	getMoodDescription,
} from "@/shared/utils/moodUtils";
import { shuffleArray } from "@/shared/utils/playerUtils";

interface UseMoodMixerReturn {
	tracks: TrackWithPopulated[];
	tracksByMood: Record<string, TrackWithPopulated[]>;
	moods: string[];
	visibleMoods: string[];
	selectedMood: string | null;
	setSelectedMood: (mood: string | null) => void;
	moodDescription: string | null;
	isLoading: boolean;
}

export function useMoodMixer(): UseMoodMixerReturn {
	const [allTracks, setAllTracks] = useState<TrackWithPopulated[]>([]);
	const [selectedMood, setSelectedMood] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchTracks = async () => {
			try {
				setIsLoading(true);
				const response = await tracksService.getAll({ limit: 100 });
				setAllTracks(response.items);
			} catch (err) {
				// silently handle
			} finally {
				setIsLoading(false);
			}
		};
		fetchTracks();
	}, []);

	const tracksByMood = useMemo(() => {
		const grouped = getTracksGroupedByMood(allTracks);
		for (const mood of Object.keys(grouped)) {
			grouped[mood] = shuffleArray(grouped[mood]);
		}
		return grouped;
	}, [allTracks]);

	const visibleMoods = selectedMood ? [selectedMood] : AVAILABLE_MOODS;

	const tracks = selectedMood
		? getTracksForMood(allTracks, selectedMood)
		: allTracks;

	const moodDescription = selectedMood
		? getMoodDescription(selectedMood)
		: null;

	return {
		tracks,
		tracksByMood,
		moods: AVAILABLE_MOODS,
		visibleMoods,
		selectedMood,
		setSelectedMood,
		moodDescription,
		isLoading,
	};
}
