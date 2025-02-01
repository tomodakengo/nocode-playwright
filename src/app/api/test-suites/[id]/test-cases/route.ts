import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';

// テストケースの作成
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { name, description, before_each, after_each } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'テストケース名は必須です' },
                { status: 400 }
            );
        }

        const db = await initializeDatabase();

        // テストスイートの存在確認
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM test_suites WHERE id = ?',
                [params.id],
                (err, row) => {
                    if (err) {
                        console.error('テストスイート確認エラー:', err);
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve(
                            NextResponse.json(
                                { error: 'テストスイートが見つかりません' },
                                { status: 404 }
                            )
                        );
                        return;
                    }

                    // テストケースの作成
                    db.run(
                        `INSERT INTO test_cases (
              suite_id, 
              name, 
              description, 
              before_each, 
              after_each
            ) VALUES (?, ?, ?, ?, ?)`,
                        [params.id, name, description, before_each, after_each],
                        function (err) {
                            if (err) {
                                console.error('テストケース作成エラー:', err);
                                reject(err);
                                return;
                            }

                            resolve(NextResponse.json({ id: this.lastID }, { status: 201 }));
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: 'テストケースの作成に失敗しました' },
            { status: 500 }
        );
    }
}

// テストケース一覧の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const db = await initializeDatabase();

        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM test_cases WHERE suite_id = ? ORDER BY created_at DESC',
                [params.id],
                (err, rows) => {
                    if (err) {
                        console.error('テストケース一覧取得エラー:', err);
                        reject(err);
                        return;
                    }
                    resolve(NextResponse.json(rows || []));
                }
            );
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: 'テストケースの取得に失敗しました' },
            { status: 500 }
        );
    }
} 