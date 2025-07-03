# 🎭 NoCode Playwright - ノーコードテストツール

MagicPod、Autify、mablのようなノーコードテストツールをPlaywrightベースで実装したプロダクトです。QAエンジニアがプログラミング知識なしで、直感的にWebテストを作成・実行できます。

## ✨ 主な特徴

### 🎯 ユーザーターゲット
- **テストコードを書いたことのないQAエンジニア**
- Webテストの自動化を始めたい初心者
- コードレスでテストを作成したい経験者

### 🚀 核心機能

#### 1. **完全ノーコード操作**
- ドラッグ&ドロップでテストステップを作成
- 視覚的なアクションライブラリ
- プログラミング知識一切不要

#### 2. **包括的なPlaywright対応**
- **50+のアクションタイプ**を実装
- 基本操作（クリック、入力、ナビゲーション）
- フォーム操作（チェックボックス、ドロップダウン、ファイルアップロード）
- 検証機能（テキスト、要素、URL、属性確認）
- 待機・スクロール・スクリーンショット機能

#### 3. **アクセシビリティ重視**
- **WCAG 2.1 AA準拠**
- スクリーンリーダー完全対応
- キーボードナビゲーション
- セマンティックHTMLとARIA属性
- カラーコントラスト配慮

#### 4. **UX/UI設計**
- **直感的でシンプル**なインターフェース
- カテゴリ別アクション整理
- 適切なカラーリング（ブルー系メイン、状態別色分け）
- レスポンシブデザイン

## 🛠️ 実装されたアクションタイプ

### 🖱️ インタラクション
```
click, double_click, right_click, hover, focus, blur
```

### ⌨️ テキスト入力・編集
```
type, fill, clear, press, press_sequentially
```

### 📝 フォーム操作
```
check, uncheck, select_option, select_text, upload_file, set_input_files
```

### 🌐 ページナビゲーション
```
navigate, go_back, go_forward, reload, close_page
```

### 📜 スクロール操作
```
scroll_into_view, scroll_to_top, scroll_to_bottom, scroll_by
```

### 🎯 ドラッグ&ドロップ
```
drag_and_drop, drag_to
```

### ⏱️ 待機操作
```
wait, wait_for_selector, wait_for_text, wait_for_url, wait_for_load_state, wait_for_timeout
```

### ✅ アサーション（検証）
```
assert_visible, assert_hidden, assert_text, assert_value, assert_attribute,
assert_url, assert_title, assert_count, assert_enabled, assert_disabled,
assert_checked, assert_unchecked, assert_contains_text
```

### 📸 スクリーンショット・レポート
```
screenshot, screenshot_element, add_annotation
```

### 🖥️ ウィンドウ・タブ操作
```
new_tab, close_tab, switch_tab, set_viewport_size
```

### 🔧 その他
```
evaluate, add_locator_handler, set_default_timeout
```

## 🏗️ システム構成

### フロントエンド
- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** (スタイリング)
- **Material-UI** (アイコン・コンポーネント)
- **@hello-pangea/dnd** (ドラッグ&ドロップ)

### バックエンド
- **Node.js** + **Express API**
- **SQLite** + **TypeORM** (データベース)
- **Playwright** (テスト実行エンジン)

### データベース構造
```sql
- action_types (アクションタイプ定義)
- test_suites (テストスイート)
- test_cases (テストケース)
- test_steps (テストステップ)
- selectors (要素セレクタ)
- pages (ページ定義)
- test_executions (実行結果)
- test_step_results (ステップ別結果)
```

## 🚀 セットアップ・起動

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバー起動
```bash
npm run dev
```

### 3. ブラウザでアクセス
```
http://localhost:3000
```

## 📖 使用方法

### 1. **ダッシュボード**
- プロジェクト統計の確認
- クイックスタートからテストビルダーにアクセス
- 機能説明と導線の提供

### 2. **テストビルダー**
- 左のアクションライブラリからアクションを選択
- ドラッグ&ドロップでテストステップを構築
- セレクタ、入力値、検証値を設定
- ワンクリックでテスト実行

### 3. **セレクタ管理**
- 再利用可能な要素セレクタを登録
- XPath、CSS、ID、class、textセレクタ対応
- ページ別セレクタ管理

### 4. **テスト実行**
- Headless/Headedモード選択
- リアルタイム実行状況表示
- 自動スクリーンショット取得
- 詳細なエラーレポート

## 🎯 Playwrightコード生成

作成したテストは自動的にPlaywrightコードに変換されます：

```javascript
import { test, expect } from '@playwright/test';

test('generated test', async ({ page }) => {
    await page.goto('https://example.com');
    await page.locator('#username').fill('test@example.com');
    await page.locator('#password').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.welcome-message')).toBeVisible();
    await expect(page).toHaveURL(/dashboard/);
});
```

## ⚡ テスト実行機能

### 実行オプション
- **Headless/Headedモード**
- **タイムアウト設定**
- **ビューポートサイズ**
- **並列実行**（将来対応）

### 実行結果
- **ステップ別実行状況**
- **実行時間測定**
- **成功/失敗/スキップ状態**
- **エラー詳細**
- **スクリーンショット**

### レポート機能
- **実行サマリー**
- **ステップ別結果**
- **エラー時の詳細ログ**
- **視覚的な成功率表示**

## 🔧 API エンドポイント

### テスト管理
```
GET    /api/test-suites              # テストスイート一覧
POST   /api/test-suites              # テストスイート作成
GET    /api/test-cases/{id}/steps    # テストステップ一覧
POST   /api/test-cases/{id}/steps    # テストステップ作成
PUT    /api/test-cases/{id}/steps/{stepId} # テストステップ更新
DELETE /api/test-cases/{id}/steps/{stepId} # テストステップ削除
```

### アクション・セレクタ
```
GET    /api/action-types             # アクションタイプ一覧
GET    /api/selectors                # セレクタ一覧
POST   /api/selectors                # セレクタ作成
```

### 実行機能
```
POST   /api/test-cases/{id}/execute  # テスト実行
GET    /api/test-cases/{id}/generate # Playwrightコード生成
```

## 🎨 デザインシステム

### カラーパレット
- **Primary**: Blue (#3B82F6) - メインアクション
- **Success**: Green (#10B981) - 成功状態
- **Warning**: Yellow (#F59E0B) - 警告
- **Error**: Red (#EF4444) - エラー状態
- **Gray**: (#6B7280) - テキスト・背景

### アクセシビリティ対応
- **カラーコントラスト**: WCAG AA準拠
- **フォーカス管理**: 適切なfocus-ring
- **ARIA属性**: ラベル、状態、役割の明示
- **キーボードナビゲーション**: 全機能対応
- **スクリーンリーダー**: 読み上げ最適化

## 🚧 将来の拡張計画

### Phase 2
- [ ] **並列テスト実行**
- [ ] **テストデータ管理**
- [ ] **環境別設定**
- [ ] **カスタムレポート**

### Phase 3
- [ ] **CI/CD統合**
- [ ] **チーム協作機能**
- [ ] **テストケース共有**
- [ ] **パフォーマンステスト**

### Phase 4
- [ ] **Visual Regression Testing**
- [ ] **Mobile Testing**
- [ ] **API Testing**
- [ ] **負荷テスト**

## 🎯 競合比較

| 機能 | NoCode Playwright | MagicPod | Autify | mabl |
|------|------------------|----------|--------|------|
| ドラッグ&ドロップ | ✅ | ✅ | ✅ | ✅ |
| Playwright対応 | ✅ | ❌ | ❌ | ❌ |
| オープンソース | ✅ | ❌ | ❌ | ❌ |
| アクセシビリティ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| 50+アクション | ✅ | ⚠️ | ⚠️ | ⚠️ |
| 日本語対応 | ✅ | ✅ | ✅ | ⚠️ |

## 🤝 貢献

このプロジェクトは、QAエンジニアの生産性向上とWebテスト自動化の民主化を目指しています。

### 改善提案
- UX/UIの改善案
- 新しいアクションタイプの提案
- アクセシビリティの向上
- パフォーマンスの最適化

## 📝 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

---

**🎭 NoCode Playwright** - Making Web Testing Accessible for Everyone