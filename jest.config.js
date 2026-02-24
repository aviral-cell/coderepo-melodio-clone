module.exports = {
	projects: [
		{
			displayName: "frontend",
			preset: "ts-jest",
			testEnvironment: "jsdom",
			roots: ["<rootDir>/__tests__"],
			testMatch: [
				"**/__tests__/task1/**/*.test.{ts,tsx}",
				"**/__tests__/task2/**/*.test.{ts,tsx}",
				"**/__tests__/task3/**/*.test.{ts,tsx}",
				"**/__tests__/task8/**/*.test.{ts,tsx}",
				"**/__tests__/task9/**/*.test.{ts,tsx}",
				"**/__tests__/task10/**/*.test.{ts,tsx}",
				"**/__tests__/task11/**/*.test.{ts,tsx}",
				"**/__tests__/task12/**/*.test.{ts,tsx}",
				"**/__tests__/task13/**/*.test.{ts,tsx}",
				"**/__tests__/task14/**/*.test.{ts,tsx}",
			],
			testPathIgnorePatterns: ["/node_modules/", "search\\.service\\.test\\.ts$", "tracks\\.service\\.test\\.ts$", "mix\\.behavior\\.test\\.ts$", "ArtistInteraction\\.behavior\\.test\\.ts$", "TrackLike\\.behavior\\.test\\.ts$"],
			moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
			setupFilesAfterEnv: ["<rootDir>/frontend/jest.setup.ts", "<rootDir>/jest.silence.js"],
			transform: {
				"^.+\\.(ts|tsx)$": [
					"ts-jest",
					{
						useESM: true,
						tsconfig: "<rootDir>/frontend/tsconfig.json",
					},
				],
			},
			moduleNameMapper: {
				"^@/(.*)$": "<rootDir>/frontend/src/$1",
				"\\.(css|less|scss|sass)$": "identity-obj-proxy",
				"\\.(jpg|jpeg|png|gif|svg|webp)$": "<rootDir>/frontend/__mocks__/fileMock.js",
			},
			transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$|@radix-ui|class-variance-authority|clsx|tailwind-merge))"],
		},
		{
			displayName: "backend",
			preset: "ts-jest",
			testEnvironment: "node",
			roots: ["<rootDir>/__tests__"],
			testMatch: [
				"**/__tests__/task3/**/*.service.test.ts",
				"**/__tests__/task4/**/*.behavior.test.ts",
				"**/__tests__/task5/**/*.behavior.test.ts",
				"**/__tests__/task6/**/*.behavior.test.ts",
				"**/__tests__/task7/**/*.behavior.test.ts",
				"**/__tests__/task13/**/*.behavior.test.ts",
				"**/__tests__/task14/**/*.behavior.test.ts",
			],
			moduleFileExtensions: ["ts", "js", "json", "node"],
			setupFilesAfterEnv: ["<rootDir>/jest.silence.js"],
			transform: {
				"^.+\\.tsx?$": [
					"ts-jest",
					{
						useESM: false,
						tsconfig: {
							module: "commonjs",
							moduleResolution: "node",
							esModuleInterop: true,
							allowSyntheticDefaultImports: true,
						},
					},
				],
			},
			moduleNameMapper: {
				"^(\\.{1,2}/.*)\\.js$": "$1",
			},
		},
	],
	reporters: [
		"default",
		[
			"jest-junit",
			{
				outputDirectory: "output",
				outputName: process.env.JEST_JUNIT_OUTPUT_NAME || "junit.xml",
			},
		],
	],
	silent: true,
	verbose: true,
	forceExit: true,
	detectOpenHandles: true,
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
	passWithNoTests: true,
};
