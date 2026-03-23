import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"react-router",
			"react-router-dom",
			"@radix-ui/react-dialog",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-scroll-area",
			"@radix-ui/react-slider",
			"@radix-ui/react-slot",
			"@dnd-kit/core",
			"@dnd-kit/sortable",
			"@dnd-kit/utilities",
			"embla-carousel-react",
			"lucide-react",
			"class-variance-authority",
			"clsx",
			"tailwind-merge",
		],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: "0.0.0.0",
		port: 3000,
		allowedHosts: [
			"vm-eddde335-9c27-4d35-8897-b9b9a3350174.asia-south1-a.c.vm-provider.internal",
			".internal",
			"localhost",
		],
		proxy: {
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
});
