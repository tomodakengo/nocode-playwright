import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// ページ一覧の取得
export async function GET() {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        const pages = await db.all(`
            SELECT 
                p.*,
                COUNT(s.id) as selector_count
            FROM pages p
            LEFT JOIN selectors s ON p.id = s.page_id
            GROUP BY p.id
            ORDER BY p.updated_at DESC
        `);

        return NextResponse.json(pages || []);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ページ一覧の取得に失敗しました' },
            { status: 500 }
        );
    }
}

// ページの作成
export async function POST(request: Request) {
    try {
        const { name, url_pattern, description } = await request.json();

        if (!name || !url_pattern) {
            return NextResponse.json(
                { error: 'ページ名とURLパターンは必須です' },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        // URLパターンの重複チェック
        const existingPage = await db.get(
            'SELECT id FROM pages WHERE url_pattern = ?',
            [url_pattern]
        );

        if (existingPage) {
            return NextResponse.json(
                { error: '同じURLパターンのページが既に存在します' },
                { status: 400 }
            );
        }

        const result = await db.run(
            `INSERT INTO pages (name, url_pattern, description)
             VALUES (?, ?, ?)`,
            [name, url_pattern, description]
        );

        return NextResponse.json({ id: result.lastID }, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ページの作成に失敗しました' },
            { status: 500 }
        );
    }
} 