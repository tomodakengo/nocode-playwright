import { Database } from 'sqlite';
import { withTransaction } from '../utils';

interface Migration {
    version: number;
    name: string;
    up: (db: Database) => Promise<void>;
    down: (db: Database) => Promise<void>;
}

interface MigrationHistory {
    version: number;
    name: string;
    applied_at: string;
    execution_time: number;
}

const migrations: Migration[] = [];

export async function initializeMigrations(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            execution_time INTEGER NOT NULL
        )
    `);
}

export async function getCurrentVersion(db: Database): Promise<number> {
    const result = await db.get('SELECT MAX(version) as version FROM migrations');
    return result?.version || 0;
}

export async function getMigrationHistory(db: Database): Promise<MigrationHistory[]> {
    return db.all('SELECT * FROM migrations ORDER BY version DESC');
}

export async function migrateUp(db: Database, targetVersion?: number): Promise<void> {
    await withTransaction(db, async (db) => {
        const currentVersion = await getCurrentVersion(db);
        const pendingMigrations = migrations
            .filter(m => m.version > currentVersion)
            .sort((a, b) => a.version - b.version);

        if (targetVersion !== undefined) {
            if (targetVersion < currentVersion) {
                throw new Error('ターゲットバージョンが現在のバージョンより小さいです');
            }
        }

        for (const migration of pendingMigrations) {
            if (targetVersion !== undefined && migration.version > targetVersion) {
                break;
            }

            const startTime = Date.now();
            try {
                await migration.up(db);
                const executionTime = Date.now() - startTime;

                await db.run(
                    'INSERT INTO migrations (version, name, execution_time) VALUES (?, ?, ?)',
                    [migration.version, migration.name, executionTime]
                );

                console.log(`マイグレーション適用: ${migration.name} (バージョン ${migration.version}) - ${executionTime}ms`);
            } catch (error) {
                console.error(`マイグレーション失敗: ${migration.name} (バージョン ${migration.version})`, error);
                throw error;
            }
        }
    });
}

export async function migrateDown(db: Database, targetVersion: number): Promise<void> {
    await withTransaction(db, async (db) => {
        const currentVersion = await getCurrentVersion(db);
        if (targetVersion >= currentVersion) {
            throw new Error('ターゲットバージョンが現在のバージョン以上です');
        }

        const migrationsToRevert = migrations
            .filter(m => m.version <= currentVersion && m.version > targetVersion)
            .sort((a, b) => b.version - a.version);

        for (const migration of migrationsToRevert) {
            const startTime = Date.now();
            try {
                await migration.down(db);
                const executionTime = Date.now() - startTime;

                await db.run('DELETE FROM migrations WHERE version = ?', [migration.version]);
                console.log(`マイグレーション取り消し: ${migration.name} (バージョン ${migration.version}) - ${executionTime}ms`);
            } catch (error) {
                console.error(`マイグレーション取り消し失敗: ${migration.name} (バージョン ${migration.version})`, error);
                throw error;
            }
        }
    });
}

export function registerMigration(migration: Migration): void {
    if (migrations.some(m => m.version === migration.version)) {
        throw new Error(`バージョン ${migration.version} のマイグレーションは既に登録されています`);
    }
    if (!migration.name) {
        throw new Error('マイグレーション名は必須です');
    }
    migrations.push(migration);
}

export async function checkMigrationStatus(db: Database): Promise<{
    current: number;
    pending: Migration[];
    applied: MigrationHistory[];
}> {
    const current = await getCurrentVersion(db);
    const applied = await getMigrationHistory(db);
    const pending = migrations
        .filter(m => m.version > current)
        .sort((a, b) => a.version - b.version);

    return { current, pending, applied };
} 