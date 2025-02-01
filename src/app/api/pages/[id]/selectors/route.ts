import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// セレクタ一覧の取得
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

        // ページの存在確認
        const page = await db.get(
            'SELECT id FROM pages WHERE id = ?',
            [params.id]
        );

        if (!page) {
            return NextResponse.json(
                { error: 'ページが見つかりません' },
                { status: 404 }
            );
        }

        const selectors = await db.all(
            `SELECT * FROM selectors WHERE page_id = ? ORDER BY name ASC`,
            [params.id]
        );

        return NextResponse.json(selectors || []);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'セレクタ一覧の取得に失敗しました' },
            { status: 500 }
        );
    }
}

// セレクタの作成
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { name, selector_type, selector_value, description, is_dynamic, wait_condition } = await request.json();

        if (!name || !selector_type || !selector_value) {
            return NextResponse.json(
                { error: 'セレクタ名、タイプ、値は必須です' },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        // ページの存在確認
        const page = await db.get(
            'SELECT id FROM pages WHERE id = ?',
            [params.id]
        );

        if (!page) {
            return NextResponse.json(
                { error: 'ページが見つかりません' },
                { status: 404 }
            );
        }

        // セレクタ名の重複チェック
        const existingSelector = await db.get(
            'SELECT id FROM selectors WHERE page_id = ? AND name = ?',
            [params.id, name]
        );

        if (existingSelector) {
            return NextResponse.json(
                { error: '同じ名前のセレクタが既に存在します' },
                { status: 400 }
            );
        }

        const result = await db.run(
            `INSERT INTO selectors (
                page_id,
                name,
                selector_type,
                selector_value,
                description,
                is_dynamic,
                wait_condition
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                params.id,
                name,
                selector_type,
                selector_value,
                description,
                is_dynamic ? 1 : 0,
                wait_condition
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