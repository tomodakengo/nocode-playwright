import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
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
        ]) as Database;

        const pages = await db.all(`
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM selectors s WHERE s.page_id = p.id) as selector_count
            FROM pages p
            ORDER BY p.updated_at DESC
        `);

        console.log('Fetched pages:', pages); // デバッグ用ログ
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
        ]) as Database;

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

        console.log('Created page:', { id: result.lastID }); // デバッグ用ログ

        // 作成したページの詳細を取得
        const newPage = await db.get(
            'SELECT * FROM pages WHERE id = ?',
            [result.lastID]
        );

        return NextResponse.json(newPage, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ページの作成に失敗しました' },
            { status: 500 }
        );
    }
} 