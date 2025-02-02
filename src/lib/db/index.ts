import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';

let database: sqlite3.Database | null = null;
const DB_TIMEOUT = 5000;

const TABLES = {
  PAGES: `
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url_pattern TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name)
        )
    `,
  SELECTORS: `
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
    `,
  ACTION_TYPES: `
        CREATE TABLE IF NOT EXISTS action_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            has_value BOOLEAN DEFAULT 0,
            has_selector BOOLEAN DEFAULT 0,
            has_assertion BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
  TEST_CASES: `
        CREATE TABLE IF NOT EXISTS test_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            suite_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            before_each TEXT,
            after_each TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE
        )
    `,
  TEST_STEPS: `
        CREATE TABLE IF NOT EXISTS test_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_case_id INTEGER NOT NULL,
            action_type_id INTEGER NOT NULL,
            selector_id INTEGER,
            input_value TEXT,
            assertion_value TEXT,
            description TEXT,
            order_index INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
            FOREIGN KEY (action_type_id) REFERENCES action_types(id),
            FOREIGN KEY (selector_id) REFERENCES selectors(id)
        )
    `
};

export async function getDatabase() {
  if (database) {
    return database;
  }

  return Promise.race([
    initializeDatabase(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), DB_TIMEOUT)
    )
  ]) as Promise<sqlite3.Database>;
}

async function createTables(db: sqlite3.Database) {
  for (const [tableName, createTableSQL] of Object.entries(TABLES)) {
    try {
      await db.exec(createTableSQL);
      console.log(`テーブルの作成に成功しました: ${tableName}`);
    } catch (error) {
      console.error(`テーブルの作成に失敗しました: ${tableName}`, error);
      throw error;
    }
  }
}

async function initializeDatabase() {
  const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'test.db');

  try {
    await mkdir(dirname(dbPath), { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await createTables(db);

    database = db as unknown as sqlite3.Database;
    return database;
  } catch (error) {
    console.error('データベースの初期化に失敗しました:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (database) {
    try {
      await (database as any).close();
      database = null;
      console.log('データベース接続を閉じました');
    } catch (error) {
      console.error('データベース接続のクローズに失敗しました:', error);
      throw error;
    }
  }
} 