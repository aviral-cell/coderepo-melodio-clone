import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * This is the standard utility for Shadcn UI components
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
