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
        switch (step.action_type_name) {
            case 'navigate':
                return `await page.goto('${step.input_value}');`;
            case 'click':
                return `await page.locator('${step.selector_value}').click();`;
            case 'type':
                return `await page.locator('${step.selector_value}').fill('${step.input_value}');`;
            case 'press':
                return `await page.keyboard.press('${step.input_value}');`;
            case 'wait':
                return `await page.locator('${step.selector_value}').waitFor({ state: '${step.wait_condition || 'visible'}' });`;
            case 'assert_visible':
                return `await expect(page.locator('${step.selector_value}')).toBeVisible();`;
            case 'assert_text':
                return `await expect(page.locator('${step.selector_value}')).toHaveText('${step.assertion_value}');`;
            case 'assert_value':
                return `await expect(page.locator('${step.selector_value}')).toHaveValue('${step.assertion_value}');`;
            case 'hover':
                return `await page.locator('${step.selector_value}').hover();`;
            case 'screenshot':
                return `await page.screenshot({ path: '${step.input_value || 'screenshot.png'}' });`;
            default:
                return `// Unsupported action: ${step.action_type_name}`;
        }
    }).join('\n    ')}
});`;

    return `${imports}\n\n${testCode}`;
} 