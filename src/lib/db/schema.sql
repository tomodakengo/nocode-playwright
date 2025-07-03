-- テストアクションの種類を管理するテーブル
CREATE TABLE IF NOT EXISTS action_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    has_value INTEGER DEFAULT 0,  -- 値の入力が必要かどうか
    has_selector INTEGER DEFAULT 0,  -- セレクタの選択が必要かどうか
    has_assertion INTEGER DEFAULT 0,  -- アサーションの設定が必要かどうか
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 基本的なアクションタイプの登録
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

-- テストステップのテーブルを更新
DROP TABLE IF EXISTS test_steps;
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