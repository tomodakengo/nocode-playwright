import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database;

        // テストケースとそれに関連するすべてのステップを取得
        const steps = await db.all(
            `SELECT 
                ts.*,
                at.name as action_type_name,
                s.selector_type,
                s.selector_value,
                s.wait_condition,
                p.url_pattern as page_url_pattern
            FROM test_steps ts
            JOIN action_types at ON ts.action_type_id = at.id
            LEFT JOIN selectors s ON ts.selector_id = s.id
            LEFT JOIN test_cases tc ON ts.test_case_id = tc.id
            LEFT JOIN pages p ON tc.page_id = p.id
            WHERE ts.test_case_id = ?
            ORDER BY ts.order_index ASC`,
            [params.id]
        );

        if (steps.length === 0) {
            return NextResponse.json(
                { error: 'テストケースが見つからないか、ステップが存在しません' },
                { status: 404 }
            );
        }

        // Playwrightコードの生成
        const code = generatePlaywrightCode(steps);
        return NextResponse.json({ code });

    } catch (error) {
        console.error('コード生成エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'コードの生成に失敗しました' },
            { status: 500 }
        );
    }
}

function generatePlaywrightCode(steps: any[]): string {
    const imports = `import { test, expect } from '@playwright/test';`;

    const testCode = `
test('generated test', async ({ page }) => {
    ${steps.map(step => {
        const selector = step.selector_value;
        const inputValue = step.input_value;
        const assertionValue = step.assertion_value;
        
        switch (step.action_type_name) {
            // 基本的なインタラクション
            case 'click':
                return `await page.locator('${selector}').click();`;
            case 'double_click':
                return `await page.locator('${selector}').dblclick();`;
            case 'right_click':
                return `await page.locator('${selector}').click({ button: 'right' });`;
            case 'hover':
                return `await page.locator('${selector}').hover();`;
            case 'focus':
                return `await page.locator('${selector}').focus();`;
            case 'blur':
                return `await page.locator('${selector}').blur();`;
            
            // テキスト入力・編集
            case 'type':
                return `await page.locator('${selector}').type('${inputValue}');`;
            case 'fill':
                return `await page.locator('${selector}').fill('${inputValue}');`;
            case 'clear':
                return `await page.locator('${selector}').clear();`;
            case 'press':
                return `await page.keyboard.press('${inputValue}');`;
            case 'press_sequentially':
                return `await page.keyboard.type('${inputValue}');`;
            
            // フォーム操作
            case 'check':
                return `await page.locator('${selector}').check();`;
            case 'uncheck':
                return `await page.locator('${selector}').uncheck();`;
            case 'select_option':
                return `await page.locator('${selector}').selectOption('${inputValue}');`;
            case 'select_text':
                return `await page.locator('${selector}').selectOption({ label: '${inputValue}' });`;
            case 'upload_file':
                return `await page.locator('${selector}').setInputFiles('${inputValue}');`;
            case 'set_input_files':
                return `await page.locator('${selector}').setInputFiles([${inputValue.split(',').map((f: string) => `'${f.trim()}'`).join(', ')}]);`;
            
            // ページナビゲーション
            case 'navigate':
                return `await page.goto('${inputValue}');`;
            case 'go_back':
                return `await page.goBack();`;
            case 'go_forward':
                return `await page.goForward();`;
            case 'reload':
                return `await page.reload();`;
            case 'close_page':
                return `await page.close();`;
            
            // スクロール操作
            case 'scroll_into_view':
                return `await page.locator('${selector}').scrollIntoViewIfNeeded();`;
            case 'scroll_to_top':
                return `await page.evaluate(() => window.scrollTo(0, 0));`;
            case 'scroll_to_bottom':
                return `await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));`;
            case 'scroll_by':
                const [x, y] = inputValue.split(',').map((v: string) => v.trim());
                return `await page.evaluate(() => window.scrollBy(${x || 0}, ${y || 0}));`;
            
            // ドラッグ&ドロップ
            case 'drag_and_drop':
                return `await page.locator('${selector}').dragTo(page.locator('${inputValue}'));`;
            case 'drag_to':
                return `await page.locator('${selector}').dragTo(page.locator('${inputValue}'));`;
            
            // 待機操作
            case 'wait':
                return `await page.locator('${selector}').waitFor({ state: '${step.wait_condition || 'visible'}' });`;
            case 'wait_for_selector':
                return `await page.waitForSelector('${inputValue}');`;
            case 'wait_for_text':
                return `await page.waitForFunction(() => document.body.innerText.includes('${inputValue}'));`;
            case 'wait_for_url':
                return `await page.waitForURL('${inputValue}');`;
            case 'wait_for_load_state':
                return `await page.waitForLoadState('${inputValue || 'load'}');`;
            case 'wait_for_timeout':
                return `await page.waitForTimeout(${inputValue});`;
            
            // アサーション（検証）
            case 'assert_visible':
                return `await expect(page.locator('${selector}')).toBeVisible();`;
            case 'assert_hidden':
                return `await expect(page.locator('${selector}')).toBeHidden();`;
            case 'assert_text':
                return `await expect(page.locator('${selector}')).toHaveText('${assertionValue}');`;
            case 'assert_value':
                return `await expect(page.locator('${selector}')).toHaveValue('${assertionValue}');`;
            case 'assert_attribute':
                const [attrName, attrValue] = inputValue.split('=');
                return `await expect(page.locator('${selector}')).toHaveAttribute('${attrName}', '${attrValue || assertionValue}');`;
            case 'assert_url':
                return `await expect(page).toHaveURL('${assertionValue}');`;
            case 'assert_title':
                return `await expect(page).toHaveTitle('${assertionValue}');`;
            case 'assert_count':
                return `await expect(page.locator('${selector}')).toHaveCount(${assertionValue});`;
            case 'assert_enabled':
                return `await expect(page.locator('${selector}')).toBeEnabled();`;
            case 'assert_disabled':
                return `await expect(page.locator('${selector}')).toBeDisabled();`;
            case 'assert_checked':
                return `await expect(page.locator('${selector}')).toBeChecked();`;
            case 'assert_unchecked':
                return `await expect(page.locator('${selector}')).not.toBeChecked();`;
            case 'assert_contains_text':
                return `await expect(page.locator('${selector}')).toContainText('${assertionValue}');`;
            
            // スクリーンショット・レポート
            case 'screenshot':
                return `await page.screenshot({ path: '${inputValue || 'screenshot.png'}' });`;
            case 'screenshot_element':
                return `await page.locator('${selector}').screenshot({ path: '${inputValue || 'element-screenshot.png'}' });`;
            case 'add_annotation':
                return `await test.info().annotations.push({ type: 'note', description: '${inputValue}' });`;
            
            // ウィンドウ・タブ操作
            case 'new_tab':
                return `const newPage = await page.context().newPage();`;
            case 'close_tab':
                return `await page.close();`;
            case 'switch_tab':
                return `// Tab switching requires manual implementation based on your test structure`;
            case 'set_viewport_size':
                const [width, height] = inputValue.split('x').map((v: string) => v.trim());
                return `await page.setViewportSize({ width: ${width}, height: ${height} });`;
            
            // その他
            case 'evaluate':
                return `await page.evaluate(() => { ${inputValue} });`;
            case 'add_locator_handler':
                return `await page.addLocatorHandler(page.locator('${selector}'), async () => { ${inputValue} });`;
            case 'set_default_timeout':
                return `page.setDefaultTimeout(${inputValue});`;
            
            default:
                return `// Unsupported action: ${step.action_type_name}`;
        }
    }).join('\n    ')}
});`;

    return `${imports}\n\n${testCode}`;
} 