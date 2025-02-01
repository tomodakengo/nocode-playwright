import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';

// テストスイート一覧の取得
export async function GET() {
    try {
        const db = await initializeDatabase();

        return new Promise((resolve, reject) => {
            db.all(
                `SELECT 
          ts.*,
          COUNT(tc.id) as test_case_count
        FROM test_suites ts
        LEFT JOIN test_cases tc ON ts.id = tc.suite_id
        GROUP BY ts.id
        ORDER BY ts.updated_at DESC`,
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(NextResponse.json(rows));
                }
            );
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'テストスイートの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// テストスイートの作成
export async function POST(request: Request) {
    try {
        const { name, description, tags } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'テストスイート名は必須です' },
                { status: 400 }
            );
        }

        const db = await initializeDatabase();

        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO test_suites (name, description, tags) VALUES (?, ?, ?)`,
                [name, description, tags],
                function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(NextResponse.json({ id: this.lastID }, { status: 201 }));
                }
            );
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'テストスイートの作成に失敗しました' },
            { status: 500 }
        );
    }
} 