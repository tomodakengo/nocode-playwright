import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { Database } from "sqlite3";
import sqlite3 from "sqlite3";

// アクションタイプ一覧の取得
export async function GET() {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        const actionTypes = await db.all(
            "SELECT * FROM action_types ORDER BY name ASC"
        );

        return NextResponse.json(actionTypes);
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "アクションタイプの取得に失敗しました" },
            { status: 500 }
        );
    }
}

// 新規アクションタイプの作成
export async function POST(request: Request) {
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

        // 同名のアクションタイプが存在するかチェック
        const existing = await db.get(
            'SELECT id FROM action_types WHERE name = ?',
            [name]
        );

        if (existing) {
            return NextResponse.json(
                { error: '同名のアクションタイプが既に存在します' },
                { status: 400 }
            );
        }

        const result = await db.run(
            `INSERT INTO action_types (
                name,
                description,
                has_value,
                has_selector,
                has_assertion
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                has_value ? 1 : 0,
                has_selector ? 1 : 0,
                has_assertion ? 1 : 0
            ]
        );

        return NextResponse.json({ id: result.lastID }, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'アクションタイプの作成に失敗しました' },
            { status: 500 }
        );
    }
} 