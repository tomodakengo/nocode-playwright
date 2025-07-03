import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { chromium, Browser, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

interface TestResult {
  status: 'passed' | 'failed' | 'error';
  duration: number;
  error?: string;
  screenshots?: string[];
  steps: StepResult[];
}

interface StepResult {
  step_id: number;
  action: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  screenshot?: string;
  duration: number;
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    let browser: Browser | null = null;
    let page: Page | null = null;
    
    try {
        const { headless = true, timeout = 30000 } = await request.json();
        
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database;

        // テストケースとステップを取得
        const steps = await db.all(
            `SELECT 
                ts.*,
                at.name as action_type_name,
                s.selector_type,
                s.selector_value,
                s.wait_condition,
                tc.name as test_case_name
            FROM test_steps ts
            JOIN action_types at ON ts.action_type_id = at.id
            LEFT JOIN selectors s ON ts.selector_id = s.id
            JOIN test_cases tc ON ts.test_case_id = tc.id
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

        // Playwrightブラウザを起動
        browser = await chromium.launch({ headless });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true,
        });
        page = await context.newPage();
        page.setDefaultTimeout(timeout);

        const testResult: TestResult = {
            status: 'passed',
            duration: 0,
            screenshots: [],
            steps: []
        };

        const startTime = Date.now();

        // 各ステップを実行
        for (const step of steps) {
            const stepStartTime = Date.now();
            const stepResult: StepResult = {
                step_id: step.id,
                action: step.action_type_name,
                status: 'passed',
                duration: 0
            };

            try {
                await executeStep(page, step);
                stepResult.duration = Date.now() - stepStartTime;
            } catch (error) {
                stepResult.status = 'failed';
                stepResult.error = error instanceof Error ? error.message : 'Unknown error';
                stepResult.duration = Date.now() - stepStartTime;
                
                // エラー時のスクリーンショット
                const screenshotPath = `test-results/error-step-${step.id}-${Date.now()}.png`;
                await page.screenshot({ path: screenshotPath });
                stepResult.screenshot = screenshotPath;
                
                testResult.status = 'failed';
                testResult.error = stepResult.error;
            }

            testResult.steps.push(stepResult);
            
            // 失敗時は後続ステップをスキップ
            if (stepResult.status === 'failed') {
                // 残りのステップをスキップとしてマーク
                const remainingSteps = steps.slice(steps.indexOf(step) + 1);
                for (const remainingStep of remainingSteps) {
                    testResult.steps.push({
                        step_id: remainingStep.id,
                        action: remainingStep.action_type_name,
                        status: 'skipped',
                        duration: 0
                    });
                }
                break;
            }
        }

        testResult.duration = Date.now() - startTime;

        // 最終スクリーンショット
        const finalScreenshotPath = `test-results/final-${params.id}-${Date.now()}.png`;
        await page.screenshot({ path: finalScreenshotPath });
        testResult.screenshots = [finalScreenshotPath];

        // テスト結果をデータベースに保存
        await saveTestResult(db, parseInt(params.id), testResult);

        return NextResponse.json(testResult);

    } catch (error) {
        console.error('テスト実行エラー:', error);
        
        // エラー時のスクリーンショット
        if (page) {
            try {
                const errorScreenshotPath = `test-results/error-${params.id}-${Date.now()}.png`;
                await page.screenshot({ path: errorScreenshotPath });
            } catch (screenshotError) {
                console.error('エラースクリーンショット取得失敗:', screenshotError);
            }
        }

        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'テストの実行に失敗しました',
                status: 'error'
            },
            { status: 500 }
        );
    } finally {
        // リソースのクリーンアップ
        try {
            if (page) await page.close();
            if (browser) await browser.close();
        } catch (cleanupError) {
            console.error('リソースクリーンアップエラー:', cleanupError);
        }
    }
}

async function executeStep(page: Page, step: any): Promise<void> {
    const selector = step.selector_value;
    const inputValue = step.input_value;
    const assertionValue = step.assertion_value;

    switch (step.action_type_name) {
        // 基本的なインタラクション
        case 'click':
            await page.locator(selector).click();
            break;
        case 'double_click':
            await page.locator(selector).dblclick();
            break;
        case 'right_click':
            await page.locator(selector).click({ button: 'right' });
            break;
        case 'hover':
            await page.locator(selector).hover();
            break;
        case 'focus':
            await page.locator(selector).focus();
            break;
        case 'blur':
            await page.locator(selector).blur();
            break;

        // テキスト入力・編集
        case 'type':
            await page.locator(selector).type(inputValue);
            break;
        case 'fill':
            await page.locator(selector).fill(inputValue);
            break;
        case 'clear':
            await page.locator(selector).clear();
            break;
        case 'press':
            await page.keyboard.press(inputValue);
            break;
        case 'press_sequentially':
            await page.keyboard.type(inputValue);
            break;

        // フォーム操作
        case 'check':
            await page.locator(selector).check();
            break;
        case 'uncheck':
            await page.locator(selector).uncheck();
            break;
        case 'select_option':
            await page.locator(selector).selectOption(inputValue);
            break;
        case 'select_text':
            await page.locator(selector).selectOption({ label: inputValue });
            break;
        case 'upload_file':
            await page.locator(selector).setInputFiles(inputValue);
            break;
        case 'set_input_files':
            const files = inputValue.split(',').map((f: string) => f.trim());
            await page.locator(selector).setInputFiles(files);
            break;

        // ページナビゲーション
        case 'navigate':
            await page.goto(inputValue);
            break;
        case 'go_back':
            await page.goBack();
            break;
        case 'go_forward':
            await page.goForward();
            break;
        case 'reload':
            await page.reload();
            break;

        // スクロール操作
        case 'scroll_into_view':
            await page.locator(selector).scrollIntoViewIfNeeded();
            break;
        case 'scroll_to_top':
            await page.evaluate(() => window.scrollTo(0, 0));
            break;
        case 'scroll_to_bottom':
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            break;
        case 'scroll_by':
            const [x, y] = inputValue.split(',').map((v: string) => parseInt(v.trim()) || 0);
            await page.evaluate(([x, y]: [number, number]) => window.scrollBy(x, y), [x, y]);
            break;

        // ドラッグ&ドロップ
        case 'drag_and_drop':
            await page.locator(selector).dragTo(page.locator(inputValue));
            break;

        // 待機操作
        case 'wait':
            await page.locator(selector).waitFor({ state: step.wait_condition || 'visible' });
            break;
        case 'wait_for_selector':
            await page.waitForSelector(inputValue);
            break;
        case 'wait_for_text':
            await page.waitForFunction((text: string) => document.body.innerText.includes(text), inputValue);
            break;
        case 'wait_for_url':
            await page.waitForURL(inputValue);
            break;
        case 'wait_for_load_state':
            await page.waitForLoadState(inputValue as any || 'load');
            break;
        case 'wait_for_timeout':
            await page.waitForTimeout(parseInt(inputValue));
            break;

        // アサーション（検証）
        case 'assert_visible':
            const visible = await page.locator(selector).isVisible();
            if (!visible) throw new Error(`要素が表示されていません: ${selector}`);
            break;
        case 'assert_hidden':
            const hidden = await page.locator(selector).isHidden();
            if (!hidden) throw new Error(`要素が非表示になっていません: ${selector}`);
            break;
        case 'assert_text':
            const text = await page.locator(selector).textContent();
            if (text !== assertionValue) throw new Error(`テキストが一致しません。期待値: ${assertionValue}, 実際の値: ${text}`);
            break;
        case 'assert_value':
            const value = await page.locator(selector).inputValue();
            if (value !== assertionValue) throw new Error(`値が一致しません。期待値: ${assertionValue}, 実際の値: ${value}`);
            break;
        case 'assert_url':
            const url = page.url();
            if (url !== assertionValue) throw new Error(`URLが一致しません。期待値: ${assertionValue}, 実際の値: ${url}`);
            break;
        case 'assert_title':
            const title = await page.title();
            if (title !== assertionValue) throw new Error(`タイトルが一致しません。期待値: ${assertionValue}, 実際の値: ${title}`);
            break;
        case 'assert_count':
            const count = await page.locator(selector).count();
            if (count !== parseInt(assertionValue)) throw new Error(`要素数が一致しません。期待値: ${assertionValue}, 実際の値: ${count}`);
            break;
        case 'assert_enabled':
            const enabled = await page.locator(selector).isEnabled();
            if (!enabled) throw new Error(`要素が有効ではありません: ${selector}`);
            break;
        case 'assert_disabled':
            const disabled = await page.locator(selector).isDisabled();
            if (!disabled) throw new Error(`要素が無効ではありません: ${selector}`);
            break;
        case 'assert_checked':
            const checked = await page.locator(selector).isChecked();
            if (!checked) throw new Error(`チェックボックスがチェックされていません: ${selector}`);
            break;
        case 'assert_unchecked':
            const unchecked = await page.locator(selector).isChecked();
            if (unchecked) throw new Error(`チェックボックスがチェックされています: ${selector}`);
            break;
        case 'assert_contains_text':
            const elementText = await page.locator(selector).textContent();
            if (!elementText?.includes(assertionValue)) throw new Error(`テキストが含まれていません。期待値: ${assertionValue}, 実際の値: ${elementText}`);
            break;

        // スクリーンショット
        case 'screenshot':
            await page.screenshot({ path: inputValue || 'screenshot.png' });
            break;
        case 'screenshot_element':
            await page.locator(selector).screenshot({ path: inputValue || 'element-screenshot.png' });
            break;

        // ウィンドウ・タブ操作
        case 'set_viewport_size':
            const [width, height] = inputValue.split('x').map((v: string) => parseInt(v.trim()));
            await page.setViewportSize({ width, height });
            break;

        // その他
        case 'evaluate':
            await page.evaluate(new Function(inputValue));
            break;
        case 'set_default_timeout':
            page.setDefaultTimeout(parseInt(inputValue));
            break;

        default:
            throw new Error(`サポートされていないアクション: ${step.action_type_name}`);
    }
}

async function saveTestResult(db: Database, testCaseId: number, result: TestResult): Promise<void> {
    // テスト実行結果テーブルが存在しない場合は作成
    await db.exec(`
        CREATE TABLE IF NOT EXISTS test_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_case_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            duration INTEGER NOT NULL,
            error TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS test_step_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            execution_id INTEGER NOT NULL,
            step_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            error TEXT,
            screenshot TEXT,
            duration INTEGER NOT NULL,
            FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
            FOREIGN KEY (step_id) REFERENCES test_steps(id) ON DELETE CASCADE
        );
    `);

    // 実行結果を保存
    const executionResult = await db.run(
        'INSERT INTO test_executions (test_case_id, status, duration, error) VALUES (?, ?, ?, ?)',
        [testCaseId, result.status, result.duration, result.error || null]
    );

    const executionId = executionResult.lastID;

    // 各ステップの結果を保存
    for (const stepResult of result.steps) {
        await db.run(
            'INSERT INTO test_step_results (execution_id, step_id, status, error, screenshot, duration) VALUES (?, ?, ?, ?, ?, ?)',
            [executionId, stepResult.step_id, stepResult.status, stepResult.error || null, stepResult.screenshot || null, stepResult.duration]
        );
    }
}