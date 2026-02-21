import { useState, useEffect, useReducer, useMemo, useCallback } from "react";
import { tracksService, artistsService } from "@/shared/services";
import { mixService } from "@/shared/services/mix.service";
import type { Mix } from "@/shared/services/mix.service";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import {
	type MixConfig,
	type MixStep,
	DEFAULT_CONFIG,
	STEP_ORDER,
	MIX_LIMIT,
	getUniqueArtists,
	generateMix,
	getMixTitle,
	getMixCoverImages,
} from "@/shared/utils/mixUtils";

interface MixArtist {
	id: string;
	name: string;
	imageUrl?: string;
	genres?: string[];
}

interface MixState {
	allTracks: TrackWithPopulated[];
	allArtists: MixArtist[];
	selectedArtistIds: string[];
	config: MixConfig;
	step: MixStep;
	mix: TrackWithPopulated[];
	isLoading: boolean;
	error: string | null;
}

type MixAction =
	| { type: "SET_TRACKS"; payload: TrackWithPopulated[] }
	| { type: "SET_ARTISTS"; payload: MixArtist[] }
	| { type: "TOGGLE_ARTIST"; payload: string }
	| { type: "SET_CONFIG"; payload: Partial<MixConfig> }
	| { type: "TOGGLE_FILTER"; payload: string }
	| { type: "NEXT_STEP" }
	| { type: "PREV_STEP" }
	| { type: "GENERATE_MIX"; payload: TrackWithPopulated[] }
	| { type: "RESET" }
	| { type: "SET_LOADING"; payload: boolean }
	| { type: "SET_ERROR"; payload: string };

const initialState: MixState = {
	allTracks: [],
	allArtists: [],
	selectedArtistIds: [],
	config: { ...DEFAULT_CONFIG },
	step: "select",
	mix: [],
	isLoading: true,
	error: null,
};

function mixReducer(state: MixState, action: MixAction): MixState {
	switch (action.type) {
		case "SET_TRACKS":
			return { ...state, allTracks: action.payload };
		case "SET_ARTISTS":
			return { ...state, allArtists: action.payload };
		case "TOGGLE_ARTIST": {
			const id = action.payload;
			const exists = state.selectedArtistIds.includes(id);
			return {
				...state,
				selectedArtistIds: exists
					? state.selectedArtistIds.filter((a) => a !== id)
					: [...state.selectedArtistIds, id],
			};
		}
		case "SET_CONFIG":
			return { ...state, config: { ...state.config, ...action.payload } };
		case "TOGGLE_FILTER": {
			const filter = action.payload;
			const exists = state.config.filters.includes(filter);
			return {
				...state,
				config: {
					...state.config,
					filters: exists
						? state.config.filters.filter((f) => f !== filter)
						: [...state.config.filters, filter],
				},
			};
		}
		case "NEXT_STEP": {
			const currentIndex = STEP_ORDER.indexOf(state.step);
			if (currentIndex < STEP_ORDER.length - 1) {
				return { ...state, step: STEP_ORDER[currentIndex + 1] };
			}
			return state;
		}
		case "PREV_STEP": {
			const currentIndex = STEP_ORDER.indexOf(state.step);
			if (currentIndex > 0) {
				return { ...state, step: STEP_ORDER[currentIndex - 1] };
			}
			return state;
		}
		case "GENERATE_MIX":
			return { ...state, mix: action.payload };
		case "RESET":
			return {
				...initialState,
				allTracks: state.allTracks,
				allArtists: state.allArtists,
				isLoading: false,
			};
		case "SET_LOADING":
			return { ...state, isLoading: action.payload };
		case "SET_ERROR":
			return { ...state, error: action.payload, isLoading: false };
		default:
			return state;
	}
}

export interface UseMixCreatorReturn {
	step: MixStep;
	availableArtists: MixArtist[];
	selectedArtistIds: string[];
	config: MixConfig;
	mix: TrackWithPopulated[];
	mixTitle: string;
	coverImages: string[];
	isLoading: boolean;
	error: string | null;
	canProceed: boolean;
	toggleArtist: (id: string) => void;
	updateConfig: (partial: Partial<MixConfig>) => void;
	toggleFilter: (filter: string) => void;
	nextStep: () => void;
	prevStep: () => void;
	reset: () => void;
	generateAndAdvance: () => TrackWithPopulated[];
	savedMixes: Mix[];
	isMixesLoading: boolean;
	isSaving: boolean;
	fetchMixes: () => Promise<void>;
	saveMix: (trackIds: string[]) => Promise<Mix>;
	removeSavedMix: (id: string) => void;
	updateSavedMixTitle: (id: string, title: string) => void;
}

export function useMixCreator(): UseMixCreatorReturn {
	const [state, dispatch] = useReducer(mixReducer, initialState);
	const [hasFetched, setHasFetched] = useState(false);
	const [savedMixes, setSavedMixes] = useState<Mix[]>([]);
	const [isMixesLoading, setIsMixesLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (hasFetched) return;

		const fetchData = async () => {
			try {
				dispatch({ type: "SET_LOADING", payload: true });
				const [tracksResponse, artistsResponse] = await Promise.all([
					tracksService.getAll({ limit: 100 }),
					artistsService.getAll({ limit: 100 }),
				]);

				const nonPodcastTracks = tracksResponse.items.filter(
					(track: TrackWithPopulated) => track.genre !== "podcast",
				);
				dispatch({ type: "SET_TRACKS", payload: nonPodcastTracks });

				const uniqueArtists = getUniqueArtists(tracksResponse.items);
				const artistMap = new Map(artistsResponse.items.map((a) => [a._id, a]));
				const enrichedArtists = uniqueArtists.map((ua) => {
					const full = artistMap.get(ua.id);
					return {
						...ua,
						genres: full?.genres ?? [],
					};
				});

				dispatch({ type: "SET_ARTISTS", payload: enrichedArtists });
				dispatch({ type: "SET_LOADING", payload: false });
				setHasFetched(true);
			} catch (err) {
				dispatch({
					type: "SET_ERROR",
					payload: err instanceof Error ? err.message : "Failed to load data",
				});
			}
		};

		fetchData();
	}, [hasFetched]);

	const fetchMixes = useCallback(async () => {
		setIsMixesLoading(true);
		try {
			const result = await mixService.getAll();
			setSavedMixes(result);
		} catch {
			setSavedMixes([]);
		} finally {
			setIsMixesLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMixes();
	}, [fetchMixes]);

	const selectedArtists = useMemo(
		() => state.allArtists.filter((a) => state.selectedArtistIds.includes(a.id)),
		[state.allArtists, state.selectedArtistIds],
	);

	const derivedGenres = useMemo(
		() => [...new Set(selectedArtists.flatMap((a) => a.genres ?? []))],
		[selectedArtists],
	);

	const mixTitle = useMemo(() => getMixTitle(selectedArtists), [selectedArtists]);

	const coverImages = useMemo(() => getMixCoverImages(selectedArtists), [selectedArtists]);

	const toggleArtist = useCallback((id: string) => {
		dispatch({ type: "TOGGLE_ARTIST", payload: id });
	}, []);

	const updateConfig = useCallback((partial: Partial<MixConfig>) => {
		dispatch({ type: "SET_CONFIG", payload: partial });
	}, []);

	const toggleFilter = useCallback((filter: string) => {
		dispatch({ type: "TOGGLE_FILTER", payload: filter });
	}, []);

	const nextStep = useCallback(() => {
		if (state.step === "configure") {
			const result = generateMix(state.allTracks, state.selectedArtistIds, derivedGenres, state.config, MIX_LIMIT);
			dispatch({ type: "GENERATE_MIX", payload: result });
		}
		dispatch({ type: "NEXT_STEP" });
	}, [state.step, state.allTracks, state.selectedArtistIds, derivedGenres, state.config]);

	const generateAndAdvance = useCallback((): TrackWithPopulated[] => {
		const result = generateMix(state.allTracks, state.selectedArtistIds, derivedGenres, state.config, MIX_LIMIT);
		dispatch({ type: "GENERATE_MIX", payload: result });
		dispatch({ type: "NEXT_STEP" });
		return result;
	}, [state.allTracks, state.selectedArtistIds, derivedGenres, state.config]);

	const prevStep = useCallback(() => {
		dispatch({ type: "PREV_STEP" });
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: "RESET" });
	}, []);

	const saveMix = useCallback(
		async (trackIds: string[]): Promise<Mix> => {
			setIsSaving(true);
			try {
				const result = await mixService.create({
					title: mixTitle,
					artistIds: state.selectedArtistIds,
					config: state.config,
					trackIds,
					coverImages,
				});
				return result;
			} finally {
				setIsSaving(false);
			}
		},
		[mixTitle, state.selectedArtistIds, state.config, coverImages],
	);

	const removeSavedMix = useCallback((id: string) => {
		setSavedMixes((prev) => prev.filter((m) => m._id !== id));
	}, []);

	const updateSavedMixTitle = useCallback((id: string, title: string) => {
		setSavedMixes((prev) => prev.map((m) => (m._id === id ? { ...m, title } : m)));
	}, []);

	const canProceed = state.selectedArtistIds.length > 0;

	return {
		step: state.step,
		availableArtists: state.allArtists,
		selectedArtistIds: state.selectedArtistIds,
		config: state.config,
		mix: state.mix,
		mixTitle,
		coverImages,
		isLoading: state.isLoading,
		error: state.error,
		canProceed,
		toggleArtist,
		updateConfig,
		toggleFilter,
		nextStep,
		prevStep,
		reset,
		generateAndAdvance,
		savedMixes,
		isMixesLoading,
		isSaving,
		fetchMixes,
		saveMix,
		removeSavedMix,
		updateSavedMixTitle,
	};
}
