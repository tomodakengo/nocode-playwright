import { MigrationInterface, QueryRunner } from 'typeorm';

export abstract class CustomMigration implements MigrationInterface {
    name?: string;
    timestamp?: number;

    abstract up(queryRunner: QueryRunner): Promise<void>;
    abstract down(queryRunner: QueryRunner): Promise<void>;

    protected async measure<T>(
        operation: () => Promise<T>,
        queryRunner: QueryRunner
    ): Promise<T> {
        const startTime = Date.now();
        try {
            const result = await operation();
            const executionTime = Date.now() - startTime;

            await queryRunner.query(
                `INSERT INTO migration_metrics (migration_name, execution_time, direction, executed_at)
                 VALUES (?, ?, ?, datetime('now'))`,
                [this.name, executionTime, 'up']
            );

            return result;
        } catch (error) {
            console.error(`マイグレーション失敗: ${this.name}`, error);
            throw error;
        }
    }
} 