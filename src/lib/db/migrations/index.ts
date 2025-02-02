import { Database } from 'sqlite';
import { withTransaction } from '../utils';

interface Migration {
    version: number;
    up: (db: Database) => Promise<void>;
    down: (db: Database) => Promise<void>;
}

const migrations: Migration[] = [];

export async function initializeMigrations(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function getCurrentVersion(db: Database): Promise<number> {
    const result = await db.get('SELECT MAX(version) as version FROM migrations');
    return result?.version || 0;
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

            await migration.up(db);
            await db.run('INSERT INTO migrations (version) VALUES (?)', [migration.version]);
            console.log(`マイグレーション適用: バージョン ${migration.version}`);
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
            await migration.down(db);
            await db.run('DELETE FROM migrations WHERE version = ?', [migration.version]);
            console.log(`マイグレーション取り消し: バージョン ${migration.version}`);
        }
    });
}

export function registerMigration(migration: Migration): void {
    if (migrations.some(m => m.version === migration.version)) {
        throw new Error(`バージョン ${migration.version} のマイグレーションは既に登録されています`);
    }
    migrations.push(migration);
} 