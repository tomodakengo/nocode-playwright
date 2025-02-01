import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// テストケース詳細の取得
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

        const testCase = await db.get(
            `SELECT tc.*, ts.name as suite_name 
            FROM test_cases tc
            JOIN test_suites ts ON tc.suite_id = ts.id
            WHERE tc.id = ? AND tc.suite_id = ?`,
            [params.testCaseId, params.id]
        );

        if (!testCase) {
            return NextResponse.json(
                { error: 'テストケースが見つかりません' },
                { status: 404 }
            );
        }

        return NextResponse.json(testCase);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストケースの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// テストケースの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
) {
    try {
        const { name, description, before_each, after_each } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'テストケース名は必須です' },
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

        // テストケースの更新
        await db.run(
            `UPDATE test_cases 
            SET name = ?, description = ?, before_each = ?, after_each = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND suite_id = ?`,
            [name, description, before_each, after_each, params.testCaseId, params.id]
        );

        return NextResponse.json(
            { message: 'テストケースを更新しました' },
            { status: 200 }
        );
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストケースの更新に失敗しました' },
            { status: 500 }
        );
    }
}

// テストケースの削除
export async function DELETE(
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

        await db.run('BEGIN TRANSACTION');

        try {
            // テストケースの存在確認
            const testCase = await db.get(
                'SELECT id FROM test_cases WHERE id = ? AND suite_id = ?',
                [params.testCaseId, params.id]
            );

            if (!testCase) {
                await db.run('ROLLBACK');
                return NextResponse.json(
                    { error: 'テストケースが見つかりません' },
                    { status: 404 }
                );
            }

            // 関連するテストステップの削除
            await db.run(
                'DELETE FROM test_steps WHERE case_id = ?',
                [params.testCaseId]
            );

            // テストケースの削除
            await db.run(
                'DELETE FROM test_cases WHERE id = ? AND suite_id = ?',
                [params.testCaseId, params.id]
            );

            await db.run('COMMIT');

            return NextResponse.json(
                { message: 'テストケースを削除しました' },
                { status: 200 }
            );
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストケースの削除に失敗しました' },
            { status: 500 }
        );
    }
} 