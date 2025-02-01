import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';

// テストステップの作成
export async function POST(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
) {
    try {
        const { name, description, action, expected_result } = await request.json();

        if (!name || !action) {
            return NextResponse.json(
                { error: 'ステップ名とアクションは必須です' },
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

                    // 現在の最大order_indexを取得
                    db.get(
                        'SELECT MAX(order_index) as max_order FROM test_steps WHERE case_id = ?',
                        [params.testCaseId],
                        (err, row) => {
                            if (err) {
                                console.error('order_index取得エラー:', err);
                                reject(err);
                                return;
                            }

                            const nextOrder = (row?.max_order || 0) + 1;

                            // テストステップの作成
                            db.run(
                                `INSERT INTO test_steps (
                                    case_id,
                                    name,
                                    description,
                                    action,
                                    expected_result,
                                    order_index
                                ) VALUES (?, ?, ?, ?, ?, ?)`,
                                [
                                    params.testCaseId,
                                    name,
                                    description,
                                    action,
                                    expected_result,
                                    nextOrder,
                                ],
                                function (err) {
                                    if (err) {
                                        console.error('テストステップ作成エラー:', err);
                                        reject(err);
                                        return;
                                    }

                                    resolve(
                                        NextResponse.json(
                                            { id: this.lastID },
                                            { status: 201 }
                                        )
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: 'テストステップの作成に失敗しました' },
            { status: 500 }
        );
    }
}

// テストステップ一覧の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string; testCaseId: string } }
) {
    try {
        const db = await initializeDatabase();

        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM test_steps WHERE case_id = ? ORDER BY order_index ASC',
                [params.testCaseId],
                (err, rows) => {
                    if (err) {
                        console.error('テストステップ一覧取得エラー:', err);
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
            { error: 'テストステップの取得に失敗しました' },
            { status: 500 }
        );
    }
} 