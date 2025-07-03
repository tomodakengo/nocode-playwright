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

        // 包括的なアクションタイプの登録（Playwrightメソッドを網羅）
        await db.exec(`
          INSERT OR IGNORE INTO action_types (name, description, has_value, has_selector, has_assertion) VALUES
          -- 基本的なインタラクション
          ('click', 'クリックアクション', 0, 1, 0),
          ('double_click', 'ダブルクリック', 0, 1, 0),
          ('right_click', '右クリック（コンテキストメニュー）', 0, 1, 0),
          ('hover', 'マウスホバー', 0, 1, 0),
          ('focus', '要素にフォーカス', 0, 1, 0),
          ('blur', 'フォーカスを外す', 0, 1, 0),
          
          -- テキスト入力・編集
          ('type', 'テキスト入力（文字ずつ）', 1, 1, 0),
          ('fill', 'テキスト入力（一括）', 1, 1, 0),
          ('clear', 'テキストクリア', 0, 1, 0),
          ('press', 'キー入力', 1, 0, 0),
          ('press_sequentially', '複数キーの順次入力', 1, 0, 0),
          
          -- フォーム操作
          ('check', 'チェックボックスON', 0, 1, 0),
          ('uncheck', 'チェックボックスOFF', 0, 1, 0),
          ('select_option', 'ドロップダウン選択（値）', 1, 1, 0),
          ('select_text', 'ドロップダウン選択（テキスト）', 1, 1, 0),
          ('upload_file', 'ファイルアップロード', 1, 1, 0),
          ('set_input_files', '複数ファイル選択', 1, 1, 0),
          
          -- ページナビゲーション
          ('navigate', 'ページ遷移', 1, 0, 0),
          ('go_back', 'ブラウザの戻るボタン', 0, 0, 0),
          ('go_forward', 'ブラウザの進むボタン', 0, 0, 0),
          ('reload', 'ページリロード', 0, 0, 0),
          ('close_page', 'ページを閉じる', 0, 0, 0),
          
          -- スクロール操作
          ('scroll_into_view', '要素までスクロール', 0, 1, 0),
          ('scroll_to_top', 'ページトップへスクロール', 0, 0, 0),
          ('scroll_to_bottom', 'ページ最下部へスクロール', 0, 0, 0),
          ('scroll_by', '指定ピクセル数スクロール', 1, 0, 0),
          
          -- ドラッグ&ドロップ
          ('drag_and_drop', 'ドラッグ&ドロップ', 1, 1, 0),
          ('drag_to', '要素をドラッグ', 0, 1, 0),
          
          -- 待機操作
          ('wait', '要素の待機', 0, 1, 0),
          ('wait_for_selector', 'セレクタ待機', 1, 0, 0),
          ('wait_for_text', 'テキスト待機', 1, 0, 0),
          ('wait_for_url', 'URL待機', 1, 0, 0),
          ('wait_for_load_state', 'ページ読み込み待機', 1, 0, 0),
          ('wait_for_timeout', 'タイムアウト待機', 1, 0, 0),
          
          -- アサーション（検証）
          ('assert_visible', '要素の表示確認', 0, 1, 0),
          ('assert_hidden', '要素の非表示確認', 0, 1, 0),
          ('assert_text', 'テキスト内容の確認', 1, 1, 1),
          ('assert_value', '入力値の確認', 1, 1, 1),
          ('assert_attribute', '属性値の確認', 1, 1, 1),
          ('assert_url', 'URL確認', 1, 0, 1),
          ('assert_title', 'ページタイトル確認', 1, 0, 1),
          ('assert_count', '要素数の確認', 1, 1, 1),
          ('assert_enabled', '要素の有効確認', 0, 1, 0),
          ('assert_disabled', '要素の無効確認', 0, 1, 0),
          ('assert_checked', 'チェックボックスON確認', 0, 1, 0),
          ('assert_unchecked', 'チェックボックスOFF確認', 0, 1, 0),
          ('assert_contains_text', 'テキスト部分一致確認', 1, 1, 1),
          
          -- スクリーンショット・レポート
          ('screenshot', 'スクリーンショット', 1, 0, 0),
          ('screenshot_element', '要素のスクリーンショット', 1, 1, 0),
          ('add_annotation', 'テスト注釈追加', 1, 0, 0),
          
          -- ウィンドウ・タブ操作
          ('new_tab', '新しいタブを開く', 0, 0, 0),
          ('close_tab', 'タブを閉じる', 0, 0, 0),
          ('switch_tab', 'タブ切り替え', 1, 0, 0),
          ('set_viewport_size', 'ビューポートサイズ設定', 1, 0, 0),
          
          -- その他
          ('evaluate', 'JavaScript実行', 1, 0, 0),
          ('add_locator_handler', 'ポップアップハンドラー', 1, 1, 0),
          ('set_default_timeout', 'デフォルトタイムアウト設定', 1, 0, 0);
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