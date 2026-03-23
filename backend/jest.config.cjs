/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "node",
	roots: ["<rootDir>/__tests__"],
	testMatch: ["**/*.behavior.test.ts"],
	moduleFileExtensions: ["ts", "js", "json", "node"],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	transform: {
		"^.+\\.(ts|tsx|js|jsx)$": [
			"@swc/jest",
			{
				jsc: {
					target: "es2022",
					parser: { syntax: "typescript" },
					transform: null,
				},
				module: { type: "commonjs" },
			},
		],
	},
	moduleDirectories: ["node_modules", "<rootDir>/node_modules", "<rootDir>/../node_modules"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	clearMocks: true,
	restoreMocks: true,
	resetMocks: true,
	passWithNoTests: true,
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/server.ts",
		"!src/scripts/**",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	testPathIgnorePatterns: ["/node_modules/"],
	modulePathIgnorePatterns: ["<rootDir>/dist/"],
	maxWorkers: 1,
};
