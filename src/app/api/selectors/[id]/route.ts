import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { Database } from 'sqlite3';

// セレクタの取得
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

        const selector = await db.get(
            'SELECT * FROM selectors WHERE id = ?',
            [params.id]
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
    { params }: { params: { id: string } }
) {
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

        // 同名の他のセレクタが存在するかチェック
        const existing = await db.get(
            'SELECT id FROM selectors WHERE name = ? AND id != ?',
            [name, params.id]
        );

        if (existing) {
            return NextResponse.json(
                { error: '同名のセレクタが既に存在します' },
                { status: 400 }
            );
        }

        await db.run(
            `UPDATE selectors 
            SET name = ?, selector_type = ?, selector_value = ?, description = ?
            WHERE id = ?`,
            [
                name,
                selector_type.toLowerCase(),
                selector_value,
                description || null,
                params.id
            ]
        );

        return NextResponse.json({ success: true });
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
    { params }: { params: { id: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        // セレクタが使用されているかチェック
        const usedSteps = await db.get(
            'SELECT id FROM test_steps WHERE selector_id = ? LIMIT 1',
            [params.id]
        );

        if (usedSteps) {
            return NextResponse.json(
                { error: 'このセレクタは使用中のため削除できません' },
                { status: 400 }
            );
        }

        await db.run('DELETE FROM selectors WHERE id = ?', [params.id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'セレクタの削除に失敗しました' },
            { status: 500 }
        );
    }
} 