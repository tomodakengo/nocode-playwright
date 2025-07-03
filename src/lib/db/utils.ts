import { Database } from 'sqlite';
import { DatabaseError } from '@/types';

export async function withTransaction<T>(
    db: Database,
    operation: (db: Database) => Promise<T>
): Promise<T> {
    await db.run('BEGIN TRANSACTION');
    try {
        const result = await operation(db);
        await db.run('COMMIT');
        return result;
    } catch (error) {
        await db.run('ROLLBACK');
        throw error;
    }
}

export function handleDatabaseError(error: unknown): DatabaseError {
    console.error('データベースエラー:', error);

    if (error instanceof Error) {
        const dbError = error as DatabaseError;
        dbError.message = `データベースエラー: ${error.message}`;
        return dbError;
    }

    return new Error('不明なデータベースエラーが発生しました') as DatabaseError;
}

export async function ensureConnection(db: Database): Promise<void> {
    try {
        await db.get('SELECT 1');
    } catch (error) {
        throw new Error('データベース接続が確立されていません');
    }
}

export function buildWhereClause(conditions: Record<string, any>): {
    where: string;
    params: any[];
} {
    const clauses: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined && value !== null) {
            clauses.push(`${key} = ?`);
            params.push(value);
        }
    }

    return {
        where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
        params
    };
}

export function buildUpdateSet(data: Record<string, any>): {
    set: string;
    params: any[];
} {
    const sets: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            sets.push(`${key} = ?`);
            params.push(value === null ? null : value);
        }
    }

    return {
        set: sets.join(', '),
        params
    };
}

export function buildOrderBy(orderBy?: string | string[]): string {
    if (!orderBy) return '';

    const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
    return `ORDER BY ${orders.join(', ')}`;
}

export async function checkForeignKeyConstraint(
    db: Database,
    table: string,
    column: string,
    value: number
): Promise<boolean> {
    const result = await db.get(
        `SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`,
        [value]
    );
    return !!result;
} 