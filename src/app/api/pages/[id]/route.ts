import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// ページ詳細の取得
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

        const page = await db.get(
            `SELECT p.*, COUNT(s.id) as selector_count
             FROM pages p
             LEFT JOIN selectors s ON p.id = s.page_id
             WHERE p.id = ?
             GROUP BY p.id`,
            [params.id]
        );

        if (!page) {
            return NextResponse.json(
                { error: 'ページが見つかりません' },
                { status: 404 }
            );
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ページの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// ページの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        // URLパターンの重複チェック（自分以外）
        const existingPage = await db.get(
            'SELECT id FROM pages WHERE url_pattern = ? AND id != ?',
            [url_pattern, params.id]
        );

        if (existingPage) {
            return NextResponse.json(
                { error: '同じURLパターンのページが既に存在します' },
                { status: 400 }
            );
        }

        // ページの存在確認
        const page = await db.get('SELECT id FROM pages WHERE id = ?', [params.id]);

        if (!page) {
            return NextResponse.json(
                { error: 'ページが見つかりません' },
                { status: 404 }
            );
        }

        await db.run(
            `UPDATE pages 
             SET name = ?, url_pattern = ?, description = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, url_pattern, description, params.id]
        );

        return NextResponse.json({ message: 'ページを更新しました' });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ページの更新に失敗しました' },
            { status: 500 }
        );
    }
}

// ページの削除
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
            // ページの存在確認
            const page = await db.get('SELECT id FROM pages WHERE id = ?', [params.id]);

            if (!page) {
                await db.run('ROLLBACK');
                return NextResponse.json(
                    { error: 'ページが見つかりません' },
                    { status: 404 }
                );
            }

            // 関連するセレクタの削除（CASCADE設定済みのため不要だが、明示的に削除）
            await db.run('DELETE FROM selectors WHERE page_id = ?', [params.id]);

            // ページの削除
            await db.run('DELETE FROM pages WHERE id = ?', [params.id]);

            await db.run('COMMIT');

            return NextResponse.json(
                { message: 'ページを削除しました' },
                { status: 200 }
            );
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ページの削除に失敗しました' },
            { status: 500 }
        );
    }
} 