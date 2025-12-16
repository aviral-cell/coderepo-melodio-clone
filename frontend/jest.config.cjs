/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	roots: ["<rootDir>/src", "<rootDir>/../__tests__"],
	testMatch: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
	testPathIgnorePatterns: ["/node_modules/", "search\\.service\\.test\\.ts$"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/**/*.d.ts",
		"!src/main.tsx",
		"!src/vite-env.d.ts",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: {
					jsx: "react-jsx",
				},
			},
		],
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
		"\\.(jpg|jpeg|png|gif|svg|webp)$": "<rootDir>/__mocks__/fileMock.js",
	},
	transformIgnorePatterns: [
		"node_modules/(?!(.*\\.mjs$|@radix-ui|class-variance-authority|clsx|tailwind-merge))",
	],
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
};
