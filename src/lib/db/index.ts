import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { DB_CONFIG, SQLITE_OPTIONS } from './config';
import { TABLES } from './schema';
import { handleDatabaseError } from './utils';
import { Database } from 'sqlite';

let database: Database | null = null;

export async function getDatabase() {
  if (database) {
    return database;
  }

  return Promise.race([
    initializeDatabase(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), DB_CONFIG.timeout)
    )
  ]);
}

async function createTables(db: Database) {
  for (const [tableName, createTableSQL] of Object.entries(TABLES)) {
    try {
      await db.exec(createTableSQL);
      if (process.env.NODE_ENV === 'development') {
        console.log(`テーブルの作成に成功しました: ${tableName}`);
      }
    } catch (error) {
      console.error(`テーブルの作成に失敗しました: ${tableName}`, error);
      throw handleDatabaseError(error);
    }
  }
}

async function initializeDatabase() {
  try {
    await mkdir(dirname(DB_CONFIG.path), { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw handleDatabaseError(error);
    }
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      sqlite3.verbose();
    }

    const db = await open({
      filename: DB_CONFIG.path,
      driver: sqlite3.Database,
      ...SQLITE_OPTIONS
    });

    // プラグマ設定
    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA busy_timeout = 5000');

    await createTables(db);

    database = db;
    return database;
  } catch (error) {
    console.error('データベースの初期化に失敗しました:', error);
    throw handleDatabaseError(error);
  }
}

export async function closeDatabase() {
  if (database) {
    try {
      await database.close();
      database = null;
      if (process.env.NODE_ENV === 'development') {
        console.log('データベース接続を閉じました');
      }
    } catch (error) {
      console.error('データベース接続のクローズに失敗しました:', error);
      throw handleDatabaseError(error);
    }
  }
}

// アプリケーション終了時にデータベース接続を閉じる
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

export { initializeDatabase } from './init'; 