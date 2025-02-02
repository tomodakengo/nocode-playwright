import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";
import { Database } from "sqlite";

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
        ]) as Database;

        await db.run("BEGIN TRANSACTION");

        try {
            // 一括更新
            for (const step of steps) {
                await db.run(
                    `UPDATE test_steps 
           SET order_index = ?
           WHERE id = ? AND test_case_id = ?`,
                    [step.order_index, step.id, params.id]
                );
            }

            await db.run("COMMIT");
            return NextResponse.json({ message: "ステップの順序を更新しました" });
        } catch (error) {
            await db.run("ROLLBACK");
            throw error;
        }
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "ステップの順序更新に失敗しました" },
            { status: 500 }
        );
    }
} 