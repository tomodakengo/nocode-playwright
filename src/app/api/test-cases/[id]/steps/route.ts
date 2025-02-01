import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";

// テストステップ一覧の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        // テストケースの存在確認
        const testCase = await db.get(
            "SELECT id FROM test_cases WHERE id = ?",
            [params.id]
        );

        if (!testCase) {
            return NextResponse.json(
                { error: "テストケースが見つかりません" },
                { status: 404 }
            );
        }

        const steps = await db.all(
            `SELECT 
        ts.id,
        ts.action_type_id,
        at.name as action_type,
        at.has_value,
        at.has_selector,
        at.has_assertion,
        ts.selector_id,
        s.name as selector_name,
        s.selector_type,
        s.selector_value,
        ts.input_value,
        ts.assertion_value,
        ts.description,
        ts.order_index
      FROM test_steps ts
      LEFT JOIN action_types at ON ts.action_type_id = at.id
      LEFT JOIN selectors s ON ts.selector_id = s.id
      WHERE ts.test_case_id = ?
      ORDER BY ts.order_index ASC`,
            [params.id]
        );

        return NextResponse.json(steps);
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "テストステップの取得に失敗しました" },
            { status: 500 }
        );
    }
}

// テストステップの作成
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const {
            action_type_id,
            selector_id,
            input_value,
            assertion_value,
            description,
            order_index,
        } = await request.json();

        if (!action_type_id || order_index === undefined) {
            return NextResponse.json(
                { error: "アクションタイプと順序は必須です" },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        // テストケースの存在確認
        const testCase = await db.get(
            "SELECT id FROM test_cases WHERE id = ?",
            [params.id]
        );

        if (!testCase) {
            return NextResponse.json(
                { error: "テストケースが見つかりません" },
                { status: 404 }
            );
        }

        // アクションタイプの存在確認
        const actionType = await db.get(
            "SELECT id FROM action_types WHERE id = ?",
            [action_type_id]
        );

        if (!actionType) {
            return NextResponse.json(
                { error: "指定されたアクションタイプが見つかりません" },
                { status: 400 }
            );
        }

        // セレクタの存在確認（セレクタIDが指定されている場合）
        if (selector_id) {
            const selector = await db.get(
                "SELECT id FROM selectors WHERE id = ?",
                [selector_id]
            );

            if (!selector) {
                return NextResponse.json(
                    { error: "指定されたセレクタが見つかりません" },
                    { status: 400 }
                );
            }
        }

        const result = await db.run(
            `INSERT INTO test_steps (
        test_case_id,
        action_type_id,
        selector_id,
        input_value,
        assertion_value,
        description,
        order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                params.id,
                action_type_id,
                selector_id,
                input_value,
                assertion_value,
                description,
                order_index,
            ]
        );

        return NextResponse.json({ id: result.lastID }, { status: 201 });
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "テストステップの作成に失敗しました" },
            { status: 500 }
        );
    }
}

// テストステップの順序更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const steps = await request.json();

        if (!Array.isArray(steps)) {
            return NextResponse.json(
                { error: "無効なデータ形式です" },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        await db.run("BEGIN TRANSACTION");

        try {
            for (const { id, order_index } of steps) {
                await db.run(
                    "UPDATE test_steps SET order_index = ? WHERE id = ? AND test_case_id = ?",
                    [order_index, id, params.id]
                );
            }

            await db.run("COMMIT");
            return NextResponse.json({ message: "テストステップの順序を更新しました" });
        } catch (error) {
            await db.run("ROLLBACK");
            throw error;
        }
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "テストステップの更新に失敗しました" },
            { status: 500 }
        );
    }
} 