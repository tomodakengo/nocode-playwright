import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";
import { Database } from "sqlite3";

// テストステップの取得
export async function GET(
    request: Request,
    { params }: { params: { id: string; testCaseId: string; stepId: string } }
) {
    try {
        const db = await Promise.race([
            initializeDatabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
            ),
        ]) as Database<sqlite3.Database>;

        const step = await db.get(
            `SELECT * FROM test_steps WHERE id = ? AND test_case_id = ?`,
            [params.stepId, params.testCaseId]
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
            {
                error:
                    error instanceof Error ? error.message : "テストステップの取得に失敗しました",
            },
            { status: 500 }
        );
    }
}

// テストステップの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string; testCaseId: string; stepId: string } }
) {
    try {
        const { name, description, action, expected_result } = await request.json();

        if (!name || !action) {
            return NextResponse.json(
                { error: "ステップ名とアクションは必須です" },
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
        const existingStep = await db.get(
            "SELECT id FROM test_steps WHERE id = ? AND test_case_id = ?",
            [params.stepId, params.testCaseId]
        );

        if (!existingStep) {
            return NextResponse.json(
                { error: "テストステップが見つかりません" },
                { status: 404 }
            );
        }

        // テストステップの更新
        await db.run(
            `UPDATE test_steps 
       SET name = ?, description = ?, action = ?, expected_result = ?
       WHERE id = ? AND test_case_id = ?`,
            [name, description, action, expected_result, params.stepId, params.testCaseId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "テストステップの更新に失敗しました",
            },
            { status: 500 }
        );
    }
} 