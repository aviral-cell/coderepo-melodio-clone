export const DEFAULT_IMAGE = "/melodio.svg";

let _imageBaseUrl = "";

export function configureImageBaseUrl(url: string): void {
	_imageBaseUrl = url;
}

const preloadedUrls = new Set<string>();

export function preloadImages(urls: (string | null | undefined)[]): void {
	urls.forEach((url) => {
		if (url && !preloadedUrls.has(url)) {
			preloadedUrls.add(url);
			const link = document.createElement("link");
			link.rel = "preload";
			link.as = "image";
			link.href = url;
			document.head.appendChild(link);
		}
	});
}

export function getImageUrl(path: string | undefined | null): string {
	if (!path) return DEFAULT_IMAGE;
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${_imageBaseUrl}${normalizedPath}`;
}
