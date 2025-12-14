export interface Config {
	mongodbUri: string;
	jwtSecret: string;
	jwtExpiresIn: string;
	port: number;
	nodeEnv: string;
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

export function loadConfig(isTest = false): Config {
	const mongodbUri = getRequiredEnv("MONGODB_URI");

	const finalMongodbUri = isTest ? appendTestSuffix(mongodbUri) : mongodbUri;

	return {
		mongodbUri: finalMongodbUri,
		jwtSecret: getRequiredEnv("JWT_SECRET"),
		jwtExpiresIn: getOptionalEnv("JWT_EXPIRES_IN", "7d"),
		port: parseInt(getOptionalEnv("PORT", "5000"), 10),
		nodeEnv: isTest ? "test" : getOptionalEnv("NODE_ENV", "development"),
	};
}

function appendTestSuffix(uri: string): string {
	const questionMarkIndex = uri.indexOf("?");
	const hasOptions = questionMarkIndex !== -1;

	if (hasOptions) {
		const baseUri = uri.substring(0, questionMarkIndex);
		const options = uri.substring(questionMarkIndex);
		return `${baseUri}_test${options}`;
	}

	return `${uri}_test`;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
	if (!configInstance) {
		throw new Error("Configuration not loaded. Call loadConfig() first after dotenv.config()");
	}
	return configInstance;
}

export function initConfig(): Config {
	configInstance = loadConfig();
	return configInstance;
}
