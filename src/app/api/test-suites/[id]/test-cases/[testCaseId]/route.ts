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