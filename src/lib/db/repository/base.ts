import { Database } from 'sqlite';
import { buildWhereClause, buildUpdateSet, buildOrderBy, withTransaction } from '../utils';

export abstract class BaseRepository<T> {
    protected abstract tableName: string;

    constructor(protected db: Database) { }

    async findById(id: number): Promise<T | null> {
        const result = await this.db.get(
            `SELECT * FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return result || null;
    }

    async findAll(orderBy?: string): Promise<T[]> {
        const order = buildOrderBy(orderBy);
        return this.db.all(`SELECT * FROM ${this.tableName} ${order}`);
    }

    async findBy(conditions: Partial<T>, orderBy?: string): Promise<T[]> {
        const { where, params } = buildWhereClause(conditions);
        const order = buildOrderBy(orderBy);
        return this.db.all(
            `SELECT * FROM ${this.tableName} ${where} ${order}`,
            params
        );
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

            return this.findById(result.lastID) as Promise<T>;
        });
    }

    async update(id: number, data: Partial<T>): Promise<T | null> {
        return withTransaction(this.db, async (db) => {
            const { set, params } = buildUpdateSet(data);
            await db.run(
                `UPDATE ${this.tableName} SET ${set} WHERE id = ?`,
                [...params, id]
            );
            return this.findById(id);
        });
    }

    async delete(id: number): Promise<boolean> {
        return withTransaction(this.db, async (db) => {
            const result = await db.run(
                `DELETE FROM ${this.tableName} WHERE id = ?`,
                [id]
            );
            return result.changes > 0;
        });
    }

    async count(conditions?: Partial<T>): Promise<number> {
        const { where, params } = conditions ? buildWhereClause(conditions) : { where: '', params: [] };
        const result = await this.db.get(
            `SELECT COUNT(*) as count FROM ${this.tableName} ${where}`,
            params
        );
        return result?.count || 0;
    }

    protected async exists(conditions: Partial<T>): Promise<boolean> {
        const count = await this.count(conditions);
        return count > 0;
    }
} 