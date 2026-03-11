module.exports = {
	projects: [
		{
			displayName: "frontend",
			preset: "ts-jest",
			testEnvironment: "jsdom",
			roots: ["<rootDir>/__tests__"],
			testMatch: ["**/*.behavior.test.tsx"],
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
			testMatch: ["**/*.behavior.test.ts"],
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
