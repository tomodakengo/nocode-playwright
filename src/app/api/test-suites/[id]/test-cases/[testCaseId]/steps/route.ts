import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// テストステップの作成
export async function POST(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
) {
    try {
        const {
            action_type_id,
            selector_id,
            input_value,
            assertion_value,
            description,
        } = await request.json();

        if (!action_type_id) {
            return NextResponse.json(
                { error: 'アクションタイプは必須です' },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        // テストケースの存在確認
        const testCase = await db.get(
            'SELECT id FROM test_cases WHERE id = ? AND suite_id = ?',
            [params.testCaseId, params.id]
        );

        if (!testCase) {
            return NextResponse.json(
                { error: 'テストケースが見つかりません' },
                { status: 404 }
            );
        }

        // 現在の最大order_indexを取得
        const orderResult = await db.get(
            'SELECT MAX(order_index) as max_order FROM test_steps WHERE test_case_id = ?',
            [params.testCaseId]
        );

        const nextOrder = (orderResult?.max_order || 0) + 1;

        // テストステップの作成
        const result = await db.run(
            `INSERT INTO test_steps (
                test_case_id,
                action_type_id,
                selector_id,
                input_value,
                assertion_value,
                description,
                order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                params.testCaseId,
                action_type_id,
                selector_id,
                input_value,
                assertion_value,
                description,
                nextOrder,
            ]
        );

        return NextResponse.json({ id: result.lastID }, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストステップの作成に失敗しました' },
            { status: 500 }
        );
    }
}

// テストステップ一覧の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        const steps = await db.all(
            'SELECT * FROM test_steps WHERE test_case_id = ? ORDER BY order_index ASC',
            [params.testCaseId]
        );

        return NextResponse.json(steps || []);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストステップの取得に失敗しました' },
            { status: 500 }
        );
    }
} 