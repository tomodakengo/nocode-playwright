import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { Database } from 'sqlite3';

// セレクタ一覧の取得
export async function GET() {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        const selectors = await db.all(
            'SELECT * FROM selectors ORDER BY name'
        );

        return NextResponse.json(selectors);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'セレクタの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// 新規セレクタの作成
export async function POST(request: Request) {
    try {
        const { name, selector_type, selector_value, description } = await request.json();

        if (!name || !selector_type || !selector_value) {
            return NextResponse.json(
                { error: 'セレクタ名、タイプ、値は必須です' },
                { status: 400 }
            );
        }

        // セレクタタイプの検証
        if (!['xpath', 'css'].includes(selector_type.toLowerCase())) {
            return NextResponse.json(
                { error: 'セレクタタイプはXPathまたはCSSのいずれかを指定してください' },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        // 同名のセレクタが存在するかチェック
        const existing = await db.get(
            'SELECT id FROM selectors WHERE name = ?',
            [name]
        );

        if (existing) {
            return NextResponse.json(
                { error: '同名のセレクタが既に存在します' },
                { status: 400 }
            );
        }

        const result = await db.run(
            `INSERT INTO selectors (
                name,
                selector_type,
                selector_value,
                description
            ) VALUES (?, ?, ?, ?)`,
            [
                name,
                selector_type.toLowerCase(),
                selector_value,
                description || null
            ]
        );

        return NextResponse.json({ id: result.lastID }, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'セレクタの作成に失敗しました' },
            { status: 500 }
        );
    }
} 