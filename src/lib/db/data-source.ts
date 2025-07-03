import { DataSource } from 'typeorm';
import { CustomBaseEntity } from './entities/base.entity';
import { MigrationMetric } from './entities/migration-metric.entity';
import path from 'path';

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(process.cwd(), 'database.sqlite'),
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [CustomBaseEntity, MigrationMetric],
    migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
    subscribers: [],
    maxQueryExecutionTime: 1000,
    cache: {
        type: 'database',
        tableName: 'typeorm_cache',
        duration: 60000 // 1分
    }
});

export async function initializeDatabase(): Promise<void> {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('データベース接続が確立されました');

            // マイグレーションの実行
            await AppDataSource.runMigrations();
            console.log('マイグレーションが完了しました');
        }
    } catch (error) {
        console.error('データベース初期化エラー:', error);
        throw error;
    }
}

export async function closeDatabase(): Promise<void> {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('データベース接続を終了しました');
    }
} 