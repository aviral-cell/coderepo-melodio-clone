interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

class CacheService {
	private cache: Map<string, CacheEntry<unknown>> = new Map();

	get<T>(key: string): T | undefined {
		const entry = this.cache.get(key);

		if (!entry) {
			return undefined;
		}

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}

		return entry.value as T;
	}

	set<T>(key: string, value: T, ttlSeconds: number): void {
		const expiresAt = Date.now() + ttlSeconds * 1000;
		this.cache.set(key, { value, expiresAt });
	}

	has(key: string): boolean {
		const entry = this.cache.get(key);

		if (!entry) {
			return false;
		}

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	size(): number {
		return this.cache.size;
	}

	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key);
			}
		}
	}
}

export const cacheService = new CacheService();
