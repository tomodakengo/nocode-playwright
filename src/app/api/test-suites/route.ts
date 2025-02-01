import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';

// テストスイート一覧の取得
export async function GET() {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]);

        const rows = await db.all(`
            SELECT 
                ts.*,
                COUNT(tc.id) as test_case_count
            FROM test_suites ts
            LEFT JOIN test_cases tc ON ts.id = tc.suite_id
            GROUP BY ts.id
            ORDER BY ts.updated_at DESC
        `);
        return NextResponse.json(rows || []);
    } catch (error) {
        console.error('データベース取得エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストスイートの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// テストスイートの作成
export async function POST(request: Request) {
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
        ]);

        const result = await db.run(
            `INSERT INTO test_suites (name, description, tags) VALUES (?, ?, ?)`,
            [name, description, tags]
        );

        if (!result.lastID) {
            throw new Error('テストスイートの作成に失敗しました');
        }

        return NextResponse.json({ id: result.lastID }, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストスイートの作成に失敗しました' },
            { status: 500 }
        );
    }
} 