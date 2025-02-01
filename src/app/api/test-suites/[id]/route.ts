import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/init';

// テストスイート詳細の取得
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const db = await initializeDatabase();

        return new Promise((resolve, reject) => {
            db.get(
                `SELECT 
          ts.*,
          COUNT(tc.id) as test_case_count
        FROM test_suites ts
        LEFT JOIN test_cases tc ON ts.id = tc.suite_id
        WHERE ts.id = ?
        GROUP BY ts.id`,
                [params.id],
                (err, row) => {
                    if (err) {
                        console.error('テストスイート詳細取得エラー:', err);
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

                    // テストケース一覧を取得
                    db.all(
                        `SELECT * FROM test_cases WHERE suite_id = ? ORDER BY created_at DESC`,
                        [params.id],
                        (err, testCases) => {
                            if (err) {
                                console.error('テストケース一覧取得エラー:', err);
                                reject(err);
                                return;
                            }

                            resolve(
                                NextResponse.json({
                                    ...row,
                                    testCases: testCases || [],
                                })
                            );
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: 'テストスイートの取得に失敗しました' },
            { status: 500 }
        );
    }
}

// テストスイートの更新
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
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
                `UPDATE test_suites 
        SET name = ?, description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
                [name, description, tags, params.id],
                function (err) {
                    if (err) {
                        console.error('テストスイート更新エラー:', err);
                        reject(err);
                        return;
                    }

                    if (this.changes === 0) {
                        resolve(
                            NextResponse.json(
                                { error: 'テストスイートが見つかりません' },
                                { status: 404 }
                            )
                        );
                        return;
                    }

                    resolve(NextResponse.json({ id: params.id }));
                }
            );
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: 'テストスイートの更新に失敗しました' },
            { status: 500 }
        );
    }
}

// テストスイートの削除
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const db = await initializeDatabase();

        return new Promise((resolve, reject) => {
            // トランザクションを開始
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // 関連するテストケースのテストステップを削除
                db.run(
                    `DELETE FROM test_steps 
          WHERE test_case_id IN (
            SELECT id FROM test_cases WHERE suite_id = ?
          )`,
                    [params.id],
                    (err) => {
                        if (err) {
                            console.error('テストステップ削除エラー:', err);
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }

                        // 関連するテストケースを削除
                        db.run(
                            'DELETE FROM test_cases WHERE suite_id = ?',
                            [params.id],
                            (err) => {
                                if (err) {
                                    console.error('テストケース削除エラー:', err);
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }

                                // テストスイートを削除
                                db.run(
                                    'DELETE FROM test_suites WHERE id = ?',
                                    [params.id],
                                    function (err) {
                                        if (err) {
                                            console.error('テストスイート削除エラー:', err);
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }

                                        if (this.changes === 0) {
                                            db.run('ROLLBACK');
                                            resolve(
                                                NextResponse.json(
                                                    { error: 'テストスイートが見つかりません' },
                                                    { status: 404 }
                                                )
                                            );
                                            return;
                                        }

                                        db.run('COMMIT');
                                        resolve(NextResponse.json({ success: true }));
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    } catch (error) {
        console.error('データベース操作エラー:', error);
        return NextResponse.json(
            { error: 'テストスイートの削除に失敗しました' },
            { status: 500 }
        );
    }
} 