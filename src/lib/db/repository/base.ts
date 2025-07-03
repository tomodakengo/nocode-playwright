import { Database } from 'sqlite';
import { buildWhereClause, buildUpdateSet, buildOrderBy, withTransaction } from '../utils';
import { DatabaseCache, withCache } from '../cache';

export abstract class BaseRepository<T> {
    protected abstract tableName: string;
    protected cache: DatabaseCache;

    constructor(protected db: Database) {
        this.cache = DatabaseCache.getInstance();
    }

    protected getCacheKey(method: string, params: any[]): string {
        return this.cache.getCacheKey(this.tableName, method, params);
    }

    async findById(id: number): Promise<T | null> {
        const cacheKey = this.getCacheKey('findById', [id]);
        return withCache(this.cache, cacheKey, async () => {
            const result = await this.db.get(
                `SELECT * FROM ${this.tableName} WHERE id = ?`,
                [id]
            );
            return result || null;
        });
    }

    async findAll(orderBy?: string): Promise<T[]> {
        const cacheKey = this.getCacheKey('findAll', [orderBy]);
        return withCache(this.cache, cacheKey, async () => {
            const order = buildOrderBy(orderBy);
            return this.db.all(`SELECT * FROM ${this.tableName} ${order}`);
        });
    }

    async findBy(conditions: Partial<T>, orderBy?: string): Promise<T[]> {
        const cacheKey = this.getCacheKey('findBy', [conditions, orderBy]);
        return withCache(this.cache, cacheKey, async () => {
            const { where, params } = buildWhereClause(conditions);
            const order = buildOrderBy(orderBy);
            return this.db.all(
                `SELECT * FROM ${this.tableName} ${where} ${order}`,
                params
            );
        });
    }

    async create(data: Omit<T, 'id'>): Promise<T> {
        return withTransaction(this.db, async (db) => {
            const { set, params } = buildUpdateSet(data);
            const columns = Object.keys(data).join(', ');
            const placeholders = params.map(() => '?').join(', ');

            const result = await db.run(
                `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
                params
            );

            const created = await this.findById(result.lastID);
            this.invalidateTableCache();
            return created as T;
        });
    }

    async update(id: number, data: Partial<T>): Promise<T | null> {
        return withTransaction(this.db, async (db) => {
            const { set, params } = buildUpdateSet(data);
            await db.run(
                `UPDATE ${this.tableName} SET ${set} WHERE id = ?`,
                [...params, id]
            );

            const updated = await this.findById(id);
            this.invalidateTableCache();
            return updated;
        });
    }

    async delete(id: number): Promise<boolean> {
        return withTransaction(this.db, async (db) => {
            const result = await db.run(
                `DELETE FROM ${this.tableName} WHERE id = ?`,
                [id]
            );
            this.invalidateTableCache();
            return result.changes > 0;
        });
    }

    async count(conditions?: Partial<T>): Promise<number> {
        const cacheKey = this.getCacheKey('count', [conditions]);
        return withCache(this.cache, cacheKey, async () => {
            const { where, params } = conditions ? buildWhereClause(conditions) : { where: '', params: [] };
            const result = await this.db.get(
                `SELECT COUNT(*) as count FROM ${this.tableName} ${where}`,
                params
            );
            return result?.count || 0;
        });
    }

    protected async exists(conditions: Partial<T>): Promise<boolean> {
        const count = await this.count(conditions);
        return count > 0;
    }

    protected invalidateTableCache(): void {
        const keys = Array.from(this.cache['cache'].keys());
        keys.forEach(key => {
            if (key.startsWith(this.tableName)) {
                this.cache.delete(key);
            }
        });
    }

    protected async paginate(
        page: number = 1,
        limit: number = 10,
        conditions?: Partial<T>,
        orderBy?: string
    ): Promise<{ items: T[]; total: number; pages: number }> {
        const offset = (page - 1) * limit;
        const { where, params } = conditions ? buildWhereClause(conditions) : { where: '', params: [] };
        const order = buildOrderBy(orderBy);

        const [items, total] = await Promise.all([
            this.db.all(
                `SELECT * FROM ${this.tableName} ${where} ${order} LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            ),
            this.count(conditions)
        ]);

        return {
            items,
            total,
            pages: Math.ceil(total / limit)
        };
    }
} 