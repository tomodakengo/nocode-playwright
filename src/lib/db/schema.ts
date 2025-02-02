export const TABLES = {
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
    TEST_SUITES: `
        CREATE TABLE IF NOT EXISTS test_suites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
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