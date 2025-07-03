import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// テストスイート詳細の取得
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
        ]) as Database<sqlite3.Database>;

        // テストスイートの基本情報を取得
        const testSuite = await db.get(
            `SELECT 
                ts.*,
                COUNT(tc.id) as test_case_count
            FROM test_suites ts
            LEFT JOIN test_cases tc ON ts.id = tc.suite_id
            WHERE ts.id = ?
            GROUP BY ts.id`,
            [params.id]
        );

        if (!testSuite) {
            return NextResponse.json(
                { error: 'テストスイートが見つかりません' },
                { status: 404 }
            );
        }

        // テストケース一覧を取得
        const testCases = await db.all(
            `SELECT * FROM test_cases WHERE suite_id = ? ORDER BY created_at DESC`,
            [params.id]
        );

        return NextResponse.json({
            ...testSuite,
            testCases: testCases || [],
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストスイートの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// テストスイートの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { name, description, tags } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'テストスイート名は必須です' },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        const result = await db.run(
            `UPDATE test_suites 
            SET name = ?, description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
            [name, description, tags, params.id]
        );

        if (result.changes === 0) {
            return NextResponse.json(
                { error: 'テストスイートが見つかりません' },
                { status: 404 }
            );
        }

        return NextResponse.json({ id: params.id });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストスイートの更新に失敗しました' },
            { status: 500 }
        );
    }
}

// テストスイートの削除
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
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
            // 関連するテストケースのテストステップを削除
            await db.run(
                `DELETE FROM test_steps 
                WHERE test_case_id IN (
                    SELECT id FROM test_cases WHERE suite_id = ?
                )`,
                [params.id]
            );

            // 関連するテストケースを削除
            await db.run(
                'DELETE FROM test_cases WHERE suite_id = ?',
                [params.id]
            );

            // テストスイートを削除
            const result = await db.run(
                'DELETE FROM test_suites WHERE id = ?',
                [params.id]
            );

            if (result.changes === 0) {
                await db.run('ROLLBACK');
                return NextResponse.json(
                    { error: 'テストスイートが見つかりません' },
                    { status: 404 }
                );
            }

            await db.run('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストスイートの削除に失敗しました' },
            { status: 500 }
        );
    }
} 