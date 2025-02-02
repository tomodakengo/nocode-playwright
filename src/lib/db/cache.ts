type CacheEntry<T> = {
    data: T;
    timestamp: number;
};

export class DatabaseCache {
    private static instance: DatabaseCache;
    private cache: Map<string, CacheEntry<any>>;
    private ttl: number;

    private constructor(ttl: number = 5000) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    static getInstance(): DatabaseCache {
        if (!DatabaseCache.instance) {
            DatabaseCache.instance = new DatabaseCache();
        }
        return DatabaseCache.instance;
    }

    set<T>(key: string, value: T): void {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    setTTL(ttl: number): void {
        this.ttl = ttl;
    }

    getCacheKey(tableName: string, query: string, params: any[]): string {
        return `${tableName}:${query}:${JSON.stringify(params)}`;
    }
}

export function withCache<T>(
    cache: DatabaseCache,
    key: string,
    operation: () => Promise<T>
): Promise<T> {
    const cachedResult = cache.get<T>(key);
    if (cachedResult !== null) {
        return Promise.resolve(cachedResult);
    }

    return operation().then(result => {
        cache.set(key, result);
        return result;
    });
} 