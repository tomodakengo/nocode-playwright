import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbPromise: Promise<Database> | null = null;

const initializeDatabase = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const db = await open({
          filename: path.join(process.cwd(), 'test.db'),
          driver: sqlite3.Database
        });

        // 外部キー制約を有効化
        await db.exec('PRAGMA foreign_keys = ON;');

        // テーブル作成
        await db.exec(`
          CREATE TABLE IF NOT EXISTS test_suites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await db.exec(`
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
          );
        `);

        await db.exec(`
          CREATE TABLE IF NOT EXISTS test_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_case_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            action TEXT NOT NULL,
            expected_result TEXT,
            order_index INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
          );
        `);

        await db.exec(`
          CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url_pattern TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(url_pattern)
          );
        `);

        await db.exec(`
          CREATE TABLE IF NOT EXISTS selectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            selector_type TEXT NOT NULL CHECK(selector_type IN ('xpath', 'css', 'text', 'id', 'class')),
            selector_value TEXT NOT NULL,
            description TEXT,
            is_dynamic BOOLEAN DEFAULT 0,
            wait_condition TEXT CHECK(wait_condition IN ('visible', 'clickable', 'present', NULL)),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
            UNIQUE(page_id, name)
          );
        `);

        await db.exec(`
          CREATE TABLE IF NOT EXISTS step_selectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            step_id INTEGER NOT NULL,
            selector_id INTEGER NOT NULL,
            input_value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (step_id) REFERENCES test_steps(id) ON DELETE CASCADE,
            FOREIGN KEY (selector_id) REFERENCES selectors(id) ON DELETE CASCADE
          );
        `);

        return db;
      } catch (error) {
        console.error('データベース初期化エラー:', error);
        dbPromise = null;
        throw error;
      }
    })();
  }

  return dbPromise;
};

export { initializeDatabase }; 