import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast, type Toast, type ToastType } from "@/shared/hooks/useToast";
import { cn } from "@/lib/utils";

/**
 * Get icon component based on toast type
 */
function getToastIcon(type: ToastType) {
	switch (type) {
		case "success":
			return CheckCircle;
		case "error":
			return AlertCircle;
		case "warning":
			return AlertTriangle;
		case "info":
			return Info;
	}
}

/**
 * Get styles based on toast type
 */
function getToastStyles(type: ToastType): string {
	switch (type) {
		case "success":
			return "bg-green-900/90 border-green-500 text-green-100";
		case "error":
			return "bg-red-900/90 border-red-500 text-red-100";
		case "warning":
			return "bg-yellow-900/90 border-yellow-500 text-yellow-100";
		case "info":
			return "bg-blue-900/90 border-blue-500 text-blue-100";
	}
}

/**
 * Get icon color based on toast type
 */
function getIconColor(type: ToastType): string {
	switch (type) {
		case "success":
			return "text-green-400";
		case "error":
			return "text-red-400";
		case "warning":
			return "text-yellow-400";
		case "info":
			return "text-blue-400";
	}
}

/**
 * Individual toast item component
 */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
	const Icon = getToastIcon(toast.type);

	return (
		<div
			role="alert"
			aria-live="assertive"
			className={cn(
				"pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300",
				"animate-in slide-in-from-top-2 fade-in-0",
				getToastStyles(toast.type)
			)}
		>
			<Icon className={cn("h-5 w-5 shrink-0", getIconColor(toast.type))} />
			<p className="flex-1 text-sm font-medium">{toast.message}</p>
			<button
				type="button"
				onClick={onClose}
				className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20"
				aria-label="Dismiss"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}

/**
 * Toaster component - renders all active toasts
 * Must be placed inside ToastProvider
 */
export function Toaster() {
	const { toasts, removeToast } = useToast();

	if (toasts.length === 0) {
		return null;
	}

	return (
		<div
			className="pointer-events-none fixed right-0 top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col sm:right-4 sm:top-4 sm:w-auto"
			aria-label="Notifications"
		>
			{toasts.map((toast) => (
				<ToastItem
					key={toast.id}
					toast={toast}
					onClose={() => removeToast(toast.id)}
				/>
			))}
		</div>
	);
}
