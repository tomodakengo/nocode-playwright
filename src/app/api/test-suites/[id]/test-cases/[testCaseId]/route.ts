import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';

// テストケース詳細の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
) {
    try {
        const db = await initializeDatabase();

        return new Promise((resolve, reject) => {
            db.get(
                `SELECT tc.*, ts.name as suite_name 
                FROM test_cases tc
                JOIN test_suites ts ON tc.suite_id = ts.id
                WHERE tc.id = ? AND tc.suite_id = ?`,
                [params.testCaseId, params.id],
                (err, row) => {
                    if (err) {
                        console.error('テストケース詳細取得エラー:', err);
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve(
                            NextResponse.json(
                                { error: 'テストケースが見つかりません' },
                                { status: 404 }
                            )
                        );
                        return;
                    }

                    resolve(NextResponse.json(row));
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

// テストケースの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
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

        return new Promise((resolve, reject) => {
            // テストケースの存在確認
            db.get(
                'SELECT id FROM test_cases WHERE id = ? AND suite_id = ?',
                [params.testCaseId, params.id],
                (err, row) => {
                    if (err) {
                        console.error('テストケース確認エラー:', err);
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve(
                            NextResponse.json(
                                { error: 'テストケースが見つかりません' },
                                { status: 404 }
                            )
                        );
                        return;
                    }

                    // テストケースの更新
                    db.run(
                        `UPDATE test_cases 
                        SET name = ?, description = ?, before_each = ?, after_each = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ? AND suite_id = ?`,
                        [name, description, before_each, after_each, params.testCaseId, params.id],
                        function (err) {
                            if (err) {
                                console.error('テストケース更新エラー:', err);
                                reject(err);
                                return;
                            }

                            resolve(
                                NextResponse.json(
                                    { message: 'テストケースを更新しました' },
                                    { status: 200 }
                                )
                            );
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: 'テストケースの更新に失敗しました' },
            { status: 500 }
        );
    }
} 