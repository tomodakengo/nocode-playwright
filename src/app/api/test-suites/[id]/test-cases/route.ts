import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// テストケースの作成
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
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

        // テストスイートの存在確認
        const testSuite = await db.get(
            'SELECT id FROM test_suites WHERE id = ?',
            [params.id]
        );

        if (!testSuite) {
            return NextResponse.json(
                { error: 'テストスイートが見つかりません' },
                { status: 404 }
            );
        }

        // テストケースの作成
        const result = await db.run(
            `INSERT INTO test_cases (
                suite_id,
                name,
                description,
                before_each,
                after_each
            ) VALUES (?, ?, ?, ?, ?)`,
            [params.id, name, description, before_each, after_each]
        );

        return NextResponse.json({ id: result.lastID }, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストケースの作成に失敗しました' },
            { status: 500 }
        );
    }
}

// テストケース一覧の取得
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

        const testCases = await db.all(
            'SELECT * FROM test_cases WHERE suite_id = ? ORDER BY created_at DESC',
            [params.id]
        );

        return NextResponse.json(testCases);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストケースの取得に失敗しました' },
            { status: 500 }
        );
    }
} 