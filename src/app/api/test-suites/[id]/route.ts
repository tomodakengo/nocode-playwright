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