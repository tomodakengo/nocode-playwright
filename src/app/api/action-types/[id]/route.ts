import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { Database } from 'sqlite3';

// アクションタイプの取得
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

        const actionType = await db.get(
            'SELECT * FROM action_types WHERE id = ?',
            [params.id]
        );

        if (!actionType) {
            return NextResponse.json(
                { error: 'アクションタイプが見つかりません' },
                { status: 404 }
            );
        }

        return NextResponse.json(actionType);
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'アクションタイプの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// アクションタイプの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { name, description, has_value, has_selector, has_assertion } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'アクションタイプ名は必須です' },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        // 同名の他のアクションタイプが存在するかチェック
        const existing = await db.get(
            'SELECT id FROM action_types WHERE name = ? AND id != ?',
            [name, params.id]
        );

        if (existing) {
            return NextResponse.json(
                { error: '同名のアクションタイプが既に存在します' },
                { status: 400 }
            );
        }

        await db.run(
            `UPDATE action_types 
            SET name = ?, description = ?, has_value = ?, has_selector = ?, has_assertion = ?
            WHERE id = ?`,
            [
                name,
                description || null,
                has_value ? 1 : 0,
                has_selector ? 1 : 0,
                has_assertion ? 1 : 0,
                params.id
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'アクションタイプの更新に失敗しました' },
            { status: 500 }
        );
    }
}

// アクションタイプの削除
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

        // アクションタイプが使用されているかチェック
        const usedSteps = await db.get(
            'SELECT id FROM test_steps WHERE action_type_id = ? LIMIT 1',
            [params.id]
        );

        if (usedSteps) {
            return NextResponse.json(
                { error: 'このアクションタイプは使用中のため削除できません' },
                { status: 400 }
            );
        }

        await db.run('DELETE FROM action_types WHERE id = ?', [params.id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'アクションタイプの削除に失敗しました' },
            { status: 500 }
        );
    }
} 