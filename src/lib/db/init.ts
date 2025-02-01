import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';

let db: Database | null = null;

export const initializeDatabase = async (): Promise<Database> => {
  if (db) {
    return db;
  }

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./test.db', async (err) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        await createTables(db!);
        resolve(db!);
      } catch (error) {
        reject(error);
      }
    });
  });
};

const createTables = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // テストスイートテーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS test_suites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // テストケーステーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS test_cases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          suite_id INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          before_each TEXT,
          after_each TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (suite_id) REFERENCES test_suites(id)
        )
      `);

      // テストステップテーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS test_steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_case_id INTEGER,
          action_type TEXT NOT NULL,
          selector TEXT NOT NULL,
          value TEXT,
          order_index INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
        )
      `);

      // セレクタテーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS selectors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_url TEXT NOT NULL,
          name TEXT NOT NULL,
          xpath TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}; 