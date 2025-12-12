/**
 * Centralized Configuration Module
 *
 * All environment variables should be accessed through this module.
 * This ensures:
 * 1. Early validation of required environment variables
 * 2. Type-safe access to configuration values
 * 3. No hardcoded fallbacks scattered throughout the codebase
 */

export interface Config {
	// MongoDB
	mongodbUri: string;

	// JWT
	jwtSecret: string;
	jwtExpiresIn: string;

	// Server
	port: number;
	nodeEnv: string;

	// CORS
	corsOrigin: string;
}

function getRequiredEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
	return process.env[key] || defaultValue;
}

/**
 * Load and validate configuration from environment variables.
 * Call this after dotenv.config() has been executed.
 *
 * @param isTest - If true, uses test database (appends _test to db name)
 */
export function loadConfig(isTest = false): Config {
	const mongodbUri = getRequiredEnv("MONGODB_URI");

	// For test environment, append _test to database name
	const finalMongodbUri = isTest ? appendTestSuffix(mongodbUri) : mongodbUri;

	return {
		mongodbUri: finalMongodbUri,
		jwtSecret: getRequiredEnv("JWT_SECRET"),
		jwtExpiresIn: getOptionalEnv("JWT_EXPIRES_IN", "7d"),
		port: parseInt(getOptionalEnv("PORT", "6001"), 10),
		nodeEnv: isTest ? "test" : getOptionalEnv("NODE_ENV", "development"),
		corsOrigin: getOptionalEnv("CORS_ORIGIN", "http://localhost:4000"),
	};
}

/**
 * Append _test suffix to MongoDB database name
 */
function appendTestSuffix(uri: string): string {
	// Parse the URI to find and modify the database name
	// Format: mongodb://user:pass@host:port/dbname?options
	const questionMarkIndex = uri.indexOf("?");
	const hasOptions = questionMarkIndex !== -1;

	if (hasOptions) {
		const baseUri = uri.substring(0, questionMarkIndex);
		const options = uri.substring(questionMarkIndex);
		return `${baseUri}_test${options}`;
	}

	return `${uri}_test`;
}

// Singleton config instance - will be initialized when loadConfig is called
let configInstance: Config | null = null;

/**
 * Get the configuration instance.
 * Throws if loadConfig() hasn't been called yet.
 */
export function getConfig(): Config {
	if (!configInstance) {
		throw new Error("Configuration not loaded. Call loadConfig() first after dotenv.config()");
	}
	return configInstance;
}

/**
 * Initialize configuration - call once at application startup after dotenv.config()
 */
export function initConfig(): Config {
	configInstance = loadConfig();
	return configInstance;
}
