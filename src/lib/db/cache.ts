import { Database } from 'sqlite';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    hits: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    averageHitRate: number;
}

export class DatabaseCache {
    private static instance: DatabaseCache;
    private cache: Map<string, CacheEntry<any>>;
    private ttl: number;
    private maxSize: number;
    private hits: number = 0;
    private misses: number = 0;

    private constructor(ttl: number = 5000, maxSize: number = 1000) {
        this.cache = new Map();
        this.ttl = ttl;
        this.maxSize = maxSize;
    }

    static getInstance(ttl?: number, maxSize?: number): DatabaseCache {
        if (!DatabaseCache.instance) {
            DatabaseCache.instance = new DatabaseCache(ttl, maxSize);
        }
        return DatabaseCache.instance;
    }

    set<T>(key: string, value: T): void {
        this.evictIfNeeded();
        this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
            hits: 0
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        entry.hits++;
        this.hits++;
        return entry.data as T;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    getStats(): CacheStats {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            size: this.cache.size,
            averageHitRate: total > 0 ? this.hits / total : 0
        };
    }

    setTTL(ttl: number): void {
        this.ttl = ttl;
    }

    setMaxSize(maxSize: number): void {
        this.maxSize = maxSize;
        this.evictIfNeeded();
    }

    getCacheKey(tableName: string, query: string, params: any[]): string {
        return `${tableName}:${query}:${JSON.stringify(params)}`;
    }

    private isExpired(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp > this.ttl;
    }

    private evictIfNeeded(): void {
        if (this.cache.size >= this.maxSize) {
            // LRU（Least Recently Used）とヒット数を組み合わせた削除戦略
            const entries = Array.from(this.cache.entries())
                .sort(([, a], [, b]) => {
                    const scoreA = (Date.now() - a.timestamp) / (a.hits + 1);
                    const scoreB = (Date.now() - b.timestamp) / (b.hits + 1);
                    return scoreB - scoreA;
                });

            // 20%のエントリを削除
            const deleteCount = Math.ceil(this.maxSize * 0.2);
            entries.slice(0, deleteCount).forEach(([key]) => {
                this.cache.delete(key);
            });
        }
    }
}

export async function withCache<T>(
    cache: DatabaseCache,
    key: string,
    operation: () => Promise<T>,
    ttl?: number
): Promise<T> {
    const cachedResult = cache.get<T>(key);
    if (cachedResult !== null) {
        return cachedResult;
    }

    const result = await operation();
    if (ttl) {
        cache.setTTL(ttl);
    }
    cache.set(key, result);
    return result;
} 