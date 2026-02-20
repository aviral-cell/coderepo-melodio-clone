import { type ImgHTMLAttributes, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { DEFAULT_IMAGE } from "@/shared/utils";

interface AppImageProps extends ImgHTMLAttributes<HTMLImageElement> {
	fallbackSrc?: string;
}

export function AppImage({ fallbackSrc = DEFAULT_IMAGE, src, className, ...props }: AppImageProps) {
	const [error, setError] = useState(false);

	useEffect(() => {
		setError(false);
	}, [src]);

	const handleError = () => {
		if (!error) {
			setError(true);
		}
	};

	return (
		<img
			src={!error && src ? src : fallbackSrc}
			className={cn("bg-zinc-800", className)}
			decoding="async"
			onError={handleError}
			{...props}
		/>
	);
}
