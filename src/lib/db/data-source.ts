import { DataSource } from 'typeorm';
import { CustomBaseEntity } from './entities/base.entity';
import path from 'path';

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(process.cwd(), 'database.sqlite'),
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [CustomBaseEntity],
    migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
    subscribers: [],
});

export async function initializeDatabase(): Promise<void> {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('データベース接続が確立されました');
        }
    } catch (error) {
        console.error('データベース接続エラー:', error);
        throw error;
    }
} 