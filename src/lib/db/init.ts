import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const initializeDatabase = async () => {
  const db = await open({
    filename: './test.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
        CREATE TABLE IF NOT EXISTS test_suites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS test_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            action TEXT NOT NULL,
            expected_result TEXT,
            order_index INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES test_cases(id) ON DELETE CASCADE
        );
    `);

  return db;
};

export { initializeDatabase }; 