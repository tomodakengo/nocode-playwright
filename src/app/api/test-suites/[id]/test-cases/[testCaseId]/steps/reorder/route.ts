import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// テストステップの順序更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
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
                setTimeout(() => reject(new Error('データベース接続がタイムアウトしました')), 5000)
            )
        ]) as Database<sqlite3.Database>;

        await db.run("BEGIN TRANSACTION");

        try {
            // テストケースの存在確認
            const testCase = await db.get(
                'SELECT id FROM test_cases WHERE id = ? AND suite_id = ?',
                [params.testCaseId, params.id]
            );

            if (!testCase) {
                await db.run("ROLLBACK");
                return NextResponse.json(
                    { error: "テストケースが見つかりません" },
                    { status: 404 }
                );
            }

            for (const { id, order_index } of steps) {
                await db.run(
                    "UPDATE test_steps SET order_index = ? WHERE id = ? AND test_case_id = ?",
                    [order_index, id, params.testCaseId]
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
            { error: error instanceof Error ? error.message : "テストステップの順序の更新に失敗しました" },
            { status: 500 }
        );
    }
} 