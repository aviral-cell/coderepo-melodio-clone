import { useState, useEffect } from "react";
import ColorThief from "colorthief";

const DEFAULT_COLOR = "rgb(40, 40, 40)";
type BrowserColorThief = {
	getColor: (image: HTMLImageElement) => [number, number, number];
};
const ColorThiefConstructor = ColorThief as unknown as { new (): BrowserColorThief };

export interface ImageColorResult {
	color: string;
	isReady: boolean;
}

export function useImageColor(imageUrl: string | undefined): ImageColorResult {
	const [color, setColor] = useState<string>(DEFAULT_COLOR);
	const [isReady, setIsReady] = useState<boolean>(false);

	useEffect(() => {
		setIsReady(false);

		if (!imageUrl) {
			setColor(DEFAULT_COLOR);
			setIsReady(true);
			return;
		}

		const img = new Image();
		img.crossOrigin = "anonymous";

		img.onload = () => {
			try {
				const colorThief = new ColorThiefConstructor();
				const [r, g, b] = colorThief.getColor(img);
				setColor(`rgb(${r}, ${g}, ${b})`);
			} catch {
				setColor(DEFAULT_COLOR);
			}
			setIsReady(true);
		};

		img.onerror = () => {
			setColor(DEFAULT_COLOR);
			setIsReady(true);
		};

		img.src = imageUrl;

		return () => {
			img.onload = null;
			img.onerror = null;
		};
	}, [imageUrl]);

	return { color, isReady };
}
