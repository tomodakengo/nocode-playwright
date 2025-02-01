import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";

// テストステップの取得
export async function GET(
    request: Request,
    { params }: { params: { id: string; stepId: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        const step = await db.get(
            `SELECT 
        ts.*,
        at.name as action_type,
        at.has_value,
        at.has_selector,
        at.has_assertion,
        s.name as selector_name,
        s.selector_type,
        s.selector_value
      FROM test_steps ts
      LEFT JOIN action_types at ON ts.action_type_id = at.id
      LEFT JOIN selectors s ON ts.selector_id = s.id
      WHERE ts.id = ? AND ts.test_case_id = ?`,
            [params.stepId, params.id]
        );

        if (!step) {
            return NextResponse.json(
                { error: "テストステップが見つかりません" },
                { status: 404 }
            );
        }

        return NextResponse.json(step);
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "テストステップの取得に失敗しました" },
            { status: 500 }
        );
    }
}

// テストステップの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string; stepId: string } }
) {
    try {
        const {
            action_type_id,
            selector_id,
            input_value,
            assertion_value,
            description,
        } = await request.json();

        if (!action_type_id) {
            return NextResponse.json(
                { error: "アクションタイプは必須です" },
                { status: 400 }
            );
        }

        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        // テストステップの存在確認
        const step = await db.get(
            "SELECT id FROM test_steps WHERE id = ? AND test_case_id = ?",
            [params.stepId, params.id]
        );

        if (!step) {
            return NextResponse.json(
                { error: "テストステップが見つかりません" },
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

        await db.run(
            `UPDATE test_steps 
      SET action_type_id = ?,
          selector_id = ?,
          input_value = ?,
          assertion_value = ?,
          description = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND test_case_id = ?`,
            [
                action_type_id,
                selector_id,
                input_value,
                assertion_value,
                description,
                params.stepId,
                params.id,
            ]
        );

        return NextResponse.json({ message: "テストステップを更新しました" });
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "テストステップの更新に失敗しました" },
            { status: 500 }
        );
    }
}

// テストステップの削除
export async function DELETE(
    request: Request,
    { params }: { params: { id: string; stepId: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        // テストステップの存在確認
        const step = await db.get(
            "SELECT id FROM test_steps WHERE id = ? AND test_case_id = ?",
            [params.stepId, params.id]
        );

        if (!step) {
            return NextResponse.json(
                { error: "テストステップが見つかりません" },
                { status: 404 }
            );
        }

        await db.run(
            "DELETE FROM test_steps WHERE id = ? AND test_case_id = ?",
            [params.stepId, params.id]
        );

        return NextResponse.json({ message: "テストステップを削除しました" });
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "テストステップの削除に失敗しました" },
            { status: 500 }
        );
    }
} 