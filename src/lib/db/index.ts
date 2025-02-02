import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';

let database: sqlite3.Database | null = null;

export async function initializeDatabase() {
    if (database) {
        return database;
    }

    const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'test.db');

    // データベースディレクトリの作成
    try {
        await mkdir(dirname(dbPath), { recursive: true });
    } catch (error) {
        // ディレクトリが既に存在する場合は無視
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
            throw error;
        }
    }

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // pagesテーブルの作成
    await db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url_pattern TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name)
    )
  `);

    // セレクタテーブルの作成
    await db.exec(`
    CREATE TABLE IF NOT EXISTS selectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      selector_type TEXT NOT NULL,
      selector_value TEXT NOT NULL,
      description TEXT,
      is_dynamic BOOLEAN DEFAULT 0,
      wait_condition TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      UNIQUE(page_id, name)
    )
  `);

    database = db as unknown as sqlite3.Database;
    return database;
}

export function getDatabase() {
    if (!database) {
        throw new Error('データベースが初期化されていません');
    }
    return database;
} 