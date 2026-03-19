import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		name: "frontend",
		include: ["frontend/__tests__/**/*.behavior.test.tsx"],
		environment: "happy-dom",
		globals: true,
		setupFiles: [
			path.resolve(__dirname, "frontend/test/setup.ts"),
			path.resolve(__dirname, "frontend/test/setup-dom.ts"),
		],
		clearMocks: true,
		restoreMocks: true,
		passWithNoTests: true,
		fileParallelism: false,
		pool: "threads",
		poolOptions: {
			threads: { singleThread: true },
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			include: ["frontend/src/**/*.{ts,tsx}"],
			exclude: ["**/*.d.ts", "**/main.tsx", "**/vite-env.d.ts"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "frontend/src"),
			"\\.(css|less|scss|sass)$": path.resolve(__dirname, "frontend/test/styleMock.ts"),
			"\\.(jpg|jpeg|png|gif|svg|webp)$": path.resolve(__dirname, "frontend/test/fileMock.js"),
		},
		dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
	},
	server: {
		deps: {
			inline: [
				/@radix-ui\/.*/,
				"class-variance-authority",
				"clsx",
				"tailwind-merge",
			],
		},
	},
});
