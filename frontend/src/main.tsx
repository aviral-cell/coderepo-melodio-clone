import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { configureImageBaseUrl } from "@/shared/utils/imageUtils";
import "./index.css";

configureImageBaseUrl(import.meta.env.VITE_IMAGE_URL || "");

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Failed to find root element");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
