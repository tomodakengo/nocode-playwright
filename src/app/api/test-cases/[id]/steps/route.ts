import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";
import { createErrorResponse, createSuccessResponse } from "@/lib/api";

// データベース接続を取得する共通関数
async function getDatabase(): Promise<Database<sqlite3.Database>> {
    return Promise.race([
        initializeDatabase(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("データベース接続がタイムアウトしました")), 5000)
        ),
    ]) as Promise<Database<sqlite3.Database>>;
}

// ステップデータを取得する共通関数
async function getStepData(db: Database<sqlite3.Database>, stepId: number | undefined) {
    if (typeof stepId !== 'number') {
        throw new Error("ステップIDが無効です");
    }
    return db.get(
        `SELECT 
            ts.id,
            ts.test_case_id,
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
        WHERE ts.id = ?`,
        [stepId]
    );
}

// テストステップ一覧の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const db = await initializeDatabase();
        
        const steps = await db.all(
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
            WHERE ts.test_case_id = ?
            ORDER BY ts.order_index ASC`,
            [params.id]
        );

        // 必ず配列を返すようにする
        return NextResponse.json(Array.isArray(steps) ? steps : []);
    } catch (error) {
        console.error("データベース操作エラー:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "ステップの取得に失敗しました" },
            { status: 500 }
        );
    }
}

// テストステップの作成
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const db = await getDatabase();
    await db.run("BEGIN TRANSACTION");

    try {
        const {
            action_type_id,
            selector_id,
            input_value = "",
            assertion_value = "",
            description = "",
            order_index,
        } = await request.json();

        if (!action_type_id || order_index === undefined) {
            await db.run("ROLLBACK");
            return createErrorResponse(new Error("アクションタイプと順序は必須です"), 400);
        }

        // テストケースの存在確認
        const testCase = await db.get(
            "SELECT id FROM test_cases WHERE id = ?",
            [params.id]
        );

        if (!testCase) {
            await db.run("ROLLBACK");
            return createErrorResponse(new Error("テストケースが見つかりません"), 404);
        }

        // アクションタイプの存在確認
        const actionType = await db.get(
            "SELECT id FROM action_types WHERE id = ?",
            [action_type_id]
        );

        if (!actionType) {
            await db.run("ROLLBACK");
            return createErrorResponse(new Error("指定されたアクションタイプが見つかりません"), 400);
        }

        // セレクタの存在確認（セレクタIDが指定されている場合）
        if (selector_id) {
            const selector = await db.get(
                "SELECT id FROM selectors WHERE id = ?",
                [selector_id]
            );

            if (!selector) {
                await db.run("ROLLBACK");
                return createErrorResponse(new Error("指定されたセレクタが見つかりません"), 400);
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

        // 作成されたステップの完全なデータを取得
        const createdStep = await getStepData(db, result.lastID);

        await db.run("COMMIT");
        return createSuccessResponse(createdStep, 201);
    } catch (error) {
        await db.run("ROLLBACK");
        return createErrorResponse(error);
    }
}

// テストステップの順序更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const db = await getDatabase();
    await db.run("BEGIN TRANSACTION");

    try {
        const steps = await request.json();

        if (!Array.isArray(steps)) {
            await db.run("ROLLBACK");
            return createErrorResponse(new Error("無効なデータ形式です"), 400);
        }

        for (const { id, order_index } of steps) {
            await db.run(
                "UPDATE test_steps SET order_index = ? WHERE id = ? AND test_case_id = ?",
                [order_index, id, params.id]
            );
        }

        // 更新後のステップ一覧を取得
        const updatedSteps = await db.all(
            `SELECT 
                ts.id,
                ts.test_case_id,
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

        await db.run("COMMIT");
        return createSuccessResponse(updatedSteps);
    } catch (error) {
        await db.run("ROLLBACK");
        return createErrorResponse(error);
    }
} 