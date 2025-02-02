import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// セレクタ詳細の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string; selectorId: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        const selector = await db.get(
            `SELECT * FROM selectors WHERE id = ? AND page_id = ?`,
            [params.selectorId, params.id]
        );

        if (!selector) {
            return NextResponse.json(
                { error: 'セレクタが見つかりません' },
                { status: 404 }
            );
        }

        return NextResponse.json(selector);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'セレクタの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// セレクタの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string; selectorId: string } }
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

        // セレクタの存在確認
        const existingSelector = await db.get(
            'SELECT id FROM selectors WHERE id = ? AND page_id = ?',
            [params.selectorId, params.id]
        );

        if (!existingSelector) {
            return NextResponse.json(
                { error: 'セレクタが見つかりません' },
                { status: 404 }
            );
        }

        // 名前の重複チェック（自分以外）
        const duplicateSelector = await db.get(
            'SELECT id FROM selectors WHERE page_id = ? AND name = ? AND id != ?',
            [params.id, name, params.selectorId]
        );

        if (duplicateSelector) {
            return NextResponse.json(
                { error: '同じ名前のセレクタが既に存在します' },
                { status: 400 }
            );
        }

        await db.run(
            `UPDATE selectors 
             SET name = ?, 
                 selector_type = ?, 
                 selector_value = ?, 
                 description = ?, 
                 is_dynamic = ?, 
                 wait_condition = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND page_id = ?`,
            [
                name,
                selector_type,
                selector_value,
                description,
                is_dynamic ? 1 : 0,
                wait_condition,
                params.selectorId,
                params.id
            ]
        );

        return NextResponse.json({ message: 'セレクタを更新しました' });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'セレクタの更新に失敗しました' },
            { status: 500 }
        );
    }
}

// セレクタの削除
export async function DELETE(
    request: Request,
    { params }: { params: { id: string; selectorId: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        // セレクタの存在確認
        const selector = await db.get(
            'SELECT id FROM selectors WHERE id = ? AND page_id = ?',
            [params.selectorId, params.id]
        );

        if (!selector) {
            return NextResponse.json(
                { error: 'セレクタが見つかりません' },
                { status: 404 }
            );
        }

        // セレクタが使用されているかチェック
        const usedSteps = await db.get(
            'SELECT id FROM test_steps WHERE selector_id = ? LIMIT 1',
            [params.selectorId]
        );

        if (usedSteps) {
            return NextResponse.json(
                { error: 'このセレクタは使用中のため削除できません' },
                { status: 400 }
            );
        }

        await db.run('DELETE FROM selectors WHERE id = ? AND page_id = ?', [
            params.selectorId,
            params.id,
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'セレクタの削除に失敗しました' },
            { status: 500 }
        );
    }
} 