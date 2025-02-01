import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { Database } from "sqlite";
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