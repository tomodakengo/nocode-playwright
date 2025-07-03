import { useState, useEffect, useCallback } from 'react';

interface DashboardStats {
  testSuites: number;
  testCases: number;
  selectors: number;
  recentExecutions: number;
  successRate: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const initialStats: DashboardStats = {
  testSuites: 0,
  testCases: 0,
  selectors: 0,
  recentExecutions: 0,
  successRate: 0
};

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 各種統計情報を並行取得
      const [suitesRes, selectorsRes] = await Promise.all([
        fetch('/api/test-suites'),
        fetch('/api/selectors')
      ]);

      if (!suitesRes.ok || !selectorsRes.ok) {
        throw new Error('統計情報の取得に失敗しました');
      }

      const [suites, selectors] = await Promise.all([
        suitesRes.json(),
        selectorsRes.json()
      ]);

      // 型チェック
      if (!Array.isArray(suites) || !Array.isArray(selectors)) {
        throw new Error('データ形式が不正です');
      }

      // テストケース数の計算
      let totalTestCases = 0;
      const testCasePromises = suites.map(async (suite: any) => {
        try {
          const casesRes = await fetch(`/api/test-suites/${suite.id}/test-cases`);
          if (casesRes.ok) {
            const cases = await casesRes.json();
            return Array.isArray(cases) ? cases.length : 0;
          }
          return 0;
        } catch (error) {
          console.error(`Failed to load test cases for suite ${suite.id}:`, error);
          return 0;
        }
      });

      const testCaseCounts = await Promise.all(testCasePromises);
      totalTestCases = testCaseCounts.reduce((sum, count) => sum + count, 0);

      // 実行履歴の取得（将来実装）
      // const executionsRes = await fetch('/api/executions/recent');
      // const executions = executionsRes.ok ? await executionsRes.json() : [];

      const newStats: DashboardStats = {
        testSuites: suites.length,
        testCases: totalTestCases,
        selectors: selectors.length,
        recentExecutions: 0, // TODO: 実行履歴から取得
        successRate: totalTestCases > 0 ? 85 : 0 // TODO: 実際の成功率を計算
      };

      setStats(newStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : '統計情報の取得に失敗しました';
      setError(message);
      console.error('統計情報取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats
  };
}