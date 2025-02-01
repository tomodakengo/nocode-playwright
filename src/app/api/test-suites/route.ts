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
                        console.error('テストスイート取得エラー:', err);
                        reject(NextResponse.json(
                            { error: 'テストスイートの取得に失敗しました' },
                            { status: 500 }
                        ));
                        return;
                    }
                    resolve(NextResponse.json(rows || []));
                }
            );
        });
    } catch (error) {
        console.error('データベース初期化エラー:', error);
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

        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO test_suites (name, description, tags) VALUES (?, ?, ?)`,
                [name, description, tags],
                function (err) {
                    if (err) {
                        console.error('テストスイート作成エラー:', err);
                        reject(new Error('テストスイートの作成に失敗しました'));
                        return;
                    }
                    resolve({ id: this.lastID });
                }
            );
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'テストスイートの作成に失敗しました' },
            { status: 500 }
        );
    }
} 