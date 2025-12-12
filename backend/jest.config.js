/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	// Run tests sequentially to avoid MongoDB connection/model conflicts
	maxWorkers: 1,
	roots: ["<rootDir>/src", "<rootDir>/__tests__"],
	testMatch: ["**/*.test.ts", "**/*.spec.ts"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/server.ts",
		"!src/scripts/**",
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
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: false,
				tsconfig: {
					module: "commonjs",
					moduleResolution: "node",
				},
			},
		],
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		// Map .js extensions to .ts for ESM-style imports
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
};
