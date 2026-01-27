interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

class CacheService {
	private cache: Map<string, CacheEntry<unknown>> = new Map();

	/**
	 * Get a value from the cache by key.
	 * Returns undefined if the key does not exist or has expired.
	 */
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

	/**
	 * Set a value in the cache with a TTL in seconds.
	 */
	set<T>(key: string, value: T, ttlSeconds: number): void {
		const expiresAt = Date.now() + ttlSeconds * 1000;
		this.cache.set(key, { value, expiresAt });
	}

	/**
	 * Check if a key exists in the cache and is not expired.
	 */
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

	/**
	 * Delete a key from the cache.
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Clear all entries from the cache.
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get the number of entries in the cache (including potentially expired ones).
	 */
	size(): number {
		return this.cache.size;
	}

	/**
	 * Remove all expired entries from the cache.
	 */
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
