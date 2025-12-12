import React, {
	createContext,
	useContext,
	useReducer,
	useCallback,
	useEffect,
	useRef,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

interface ToastInput {
	message: string;
	type: ToastType;
	duration?: number;
}

interface ToastState {
	toasts: Toast[];
}

type ToastAction =
	| { type: "ADD_TOAST"; payload: Toast }
	| { type: "REMOVE_TOAST"; payload: string };

const DEFAULT_DURATION = 5000;

function toastReducer(state: ToastState, action: ToastAction): ToastState {
	switch (action.type) {
		case "ADD_TOAST":
			return {
				...state,
				toasts: [...state.toasts, action.payload],
			};
		case "REMOVE_TOAST":
			return {
				...state,
				toasts: state.toasts.filter((t) => t.id !== action.payload),
			};
		default:
			return state;
	}
}

interface ToastContextType {
	toasts: Toast[];
	addToast: (input: ToastInput) => string;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(toastReducer, { toasts: [] });
	const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map()
	);

	const removeToast = useCallback((id: string) => {
		dispatch({ type: "REMOVE_TOAST", payload: id });
		const timer = timersRef.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timersRef.current.delete(id);
		}
	}, []);

	const addToast = useCallback(
		(input: ToastInput): string => {
			const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			const duration = input.duration ?? DEFAULT_DURATION;

			const toast: Toast = {
				id,
				message: input.message,
				type: input.type,
				duration,
			};

			dispatch({ type: "ADD_TOAST", payload: toast });

			const timer = setTimeout(() => {
				removeToast(id);
			}, duration);

			timersRef.current.set(id, timer);

			return id;
		},
		[removeToast]
	);

	useEffect(() => {
		return () => {
			timersRef.current.forEach((timer) => clearTimeout(timer));
			timersRef.current.clear();
		};
	}, []);

	return (
		<ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast }}>
			{children}
		</ToastContext.Provider>
	);
}

export function useToast(): ToastContextType {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
