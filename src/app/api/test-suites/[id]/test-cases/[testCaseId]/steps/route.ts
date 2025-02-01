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
        const { name, description, action, expected_result } = await request.json();

        if (!name || !action) {
            return NextResponse.json(
                { error: 'ステップ名とアクションは必須です' },
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
            'SELECT MAX(order_index) as max_order FROM test_steps WHERE case_id = ?',
            [params.testCaseId]
        );

        const nextOrder = (orderResult?.max_order || 0) + 1;

        // テストステップの作成
        const result = await db.run(
            `INSERT INTO test_steps (
                case_id,
                name,
                description,
                action,
                expected_result,
                order_index
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                params.testCaseId,
                name,
                description,
                action,
                expected_result,
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
            'SELECT * FROM test_steps WHERE case_id = ? ORDER BY order_index ASC',
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