import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const frontendNodeModules = path.resolve(__dirname, "frontend/node_modules");
const resolveFrontendDep = (relativePath: string) =>
	path.resolve(frontendNodeModules, relativePath);

const frontendRuntimeResolver = {
	name: "frontend-runtime-resolver",
	enforce: "pre" as const,
	resolveId(source: string) {
		switch (source) {
			case "react":
				return resolveFrontendDep("react/index.js");
			case "react/jsx-runtime":
				return resolveFrontendDep("react/jsx-runtime.js");
			case "react/jsx-dev-runtime":
				return resolveFrontendDep("react/jsx-dev-runtime.js");
			case "react-dom":
				return resolveFrontendDep("react-dom/index.js");
			case "react-dom/client":
				return resolveFrontendDep("react-dom/client.js");
			default:
				return null;
		}
	},
};

export default defineConfig({
	plugins: [frontendRuntimeResolver, react()],
	test: {
		name: "frontend",
		include: ["frontend/__tests__/**/*.behavior.test.tsx"],
		environment: "jsdom",
		globals: true,
		setupFiles: [
			path.resolve(__dirname, "frontend/test/setup.ts"),
			path.resolve(__dirname, "frontend/test/setup-dom.ts"),
		],
		clearMocks: true,
		restoreMocks: true,
		passWithNoTests: true,
		pool: "threads",
		poolOptions: {
			threads: { singleThread: false },
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
