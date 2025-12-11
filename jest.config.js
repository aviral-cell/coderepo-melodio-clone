/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	roots: ["<rootDir>/__tests__"],
	testMatch: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	setupFilesAfterEnv: ["<rootDir>/frontend/jest.setup.ts"],
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: {
					jsx: "react-jsx",
					esModuleInterop: true,
					allowSyntheticDefaultImports: true,
				},
			},
		],
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/frontend/src/$1",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
		"\\.(jpg|jpeg|png|gif|svg|webp)$": "<rootDir>/frontend/__mocks__/fileMock.js",
	},
	transformIgnorePatterns: [
		"node_modules/(?!(.*\\.mjs$|@radix-ui|class-variance-authority|clsx|tailwind-merge))",
	],
	reporters: [
		"default",
		[
			"jest-junit",
			{
				outputDirectory: "output",
				outputName: "junit.xml",
			},
		],
	],
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
	passWithNoTests: true,
};
