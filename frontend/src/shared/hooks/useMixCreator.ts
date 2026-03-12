import { useReducer } from "react";
import type { Mix } from "@/shared/services/mix.service";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import {
	type MixConfig,
	type MixStep,
	DEFAULT_CONFIG
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

const mockArtists: MixArtist[] = [
	{ id: "mock-a1", name: "Mock Artist 1", imageUrl: "", genres: ["rock"] },
	{ id: "mock-a2", name: "Mock Artist 2", imageUrl: "", genres: ["pop"] },
	{ id: "mock-a3", name: "Mock Artist 3", imageUrl: "", genres: ["jazz"] },
];

const initialState: MixState = {
	allTracks: [],
	allArtists: mockArtists,
	selectedArtistIds: [],
	config: { ...DEFAULT_CONFIG },
	step: "select",
	mix: [],
	isLoading: false,
	error: null,
};

function mixReducer(state: MixState, action: MixAction): MixState {
	return state;
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

	return {
		step: state.step,
		availableArtists: state.allArtists,
		selectedArtistIds: state.selectedArtistIds,
		config: state.config,
		mix: state.mix,
		mixTitle: "",
		coverImages: [],
		isLoading: state.isLoading,
		error: state.error,
		canProceed: false,
		toggleArtist: () => {},
		toggleFilter: () => {},
		updateConfig: () => {},
		nextStep: () => {},
		prevStep: () => {},
		reset: () => {},
		generateAndAdvance: () => [],
		savedMixes: [],
		isMixesLoading: false,
		isSaving: false,
		fetchMixes: async () => {},
		saveMix: async () => ({}) as Mix,
		removeSavedMix: () => {},
		updateSavedMixTitle: () => {},
	};
}
