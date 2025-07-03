import { join } from 'path';
import { DbConfig } from '@/types';

export const DB_CONFIG: DbConfig = {
    path: process.env.DATABASE_PATH || join(process.cwd(), 'data', 'test.db'),
    timeout: 5000,
    maxConnections: 10
};

export const SQLITE_OPTIONS = {
    verbose: process.env.NODE_ENV === 'development',
    fileMustExist: false,
    timeout: DB_CONFIG.timeout,
    foreignKeys: true
};

export const DEFAULT_ORDER_BY = {
    pages: 'updated_at DESC',
    selectors: 'name ASC',
    action_types: 'name ASC',
    test_cases: 'updated_at DESC',
    test_steps: 'order_index ASC'
}; 