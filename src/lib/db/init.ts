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

        // テストアクションの種類を管理するテーブル
        await db.exec(`
          CREATE TABLE IF NOT EXISTS action_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            has_value INTEGER DEFAULT 0,
            has_selector INTEGER DEFAULT 0,
            has_assertion INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // 基本的なアクションタイプの登録
        await db.exec(`
          INSERT OR IGNORE INTO action_types (name, description, has_value, has_selector, has_assertion) VALUES
          ('click', 'クリックアクション', 0, 1, 0),
          ('type', 'テキスト入力', 1, 1, 0),
          ('wait', '要素の待機', 0, 1, 0),
          ('assert_visible', '要素の表示確認', 0, 1, 0),
          ('assert_text', 'テキスト内容の確認', 1, 1, 1),
          ('assert_value', '入力値の確認', 1, 1, 1),
          ('hover', 'マウスホバー', 0, 1, 0),
          ('press', 'キー入力', 1, 0, 0),
          ('navigate', 'ページ遷移', 1, 0, 0),
          ('screenshot', 'スクリーンショット', 1, 0, 0);
        `);

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

        // テストステップテーブルを再作成
        await db.exec(`DROP TABLE IF EXISTS test_steps;`);

        await db.exec(`
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