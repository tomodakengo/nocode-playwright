import { useState, useEffect } from 'react';

interface TestSuite {
    id: number;
    name: string;
    description: string | null;
    tags: string | null;
    created_at: string;
    updated_at: string;
    test_case_count: number;
}

export function useTestSuites() {
    const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // テストスイート一覧の取得
    const fetchTestSuites = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/test-suites');
            if (!response.ok) {
                throw new Error('テストスイートの取得に失敗しました');
            }
            const data = await response.json();
            setTestSuites(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    // テストスイートの作成
    const createTestSuite = async (data: {
        name: string;
        description?: string;
        tags?: string;
    }): Promise<{ success: boolean; error?: string; id?: number }> => {
        try {
            const response = await fetch('/api/test-suites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: responseData.error || 'テストスイートの作成に失敗しました'
                };
            }

            await fetchTestSuites(); // 一覧を再取得
            return {
                success: true,
                id: responseData.id
            };
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : '予期せぬエラーが発生しました'
            };
        }
    };

    // 初回読み込み時にデータを取得
    useEffect(() => {
        fetchTestSuites();
    }, []);

    return {
        testSuites,
        loading,
        error,
        fetchTestSuites,
        createTestSuite,
    };
} 