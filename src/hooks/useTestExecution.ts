import { useState, useCallback } from 'react';
import { ExecutionResult } from '@/types';

interface UseTestExecutionOptions {
  onExecutionComplete?: (result: ExecutionResult) => void;
}

interface UseTestExecutionReturn {
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  error: string | null;
  executeTest: (testCaseId: number, options?: ExecutionOptions) => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

interface ExecutionOptions {
  headless?: boolean;
  timeout?: number;
  browser?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
}

export function useTestExecution({ 
  onExecutionComplete 
}: UseTestExecutionOptions = {}): UseTestExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeTest = useCallback(async (
    testCaseId: number, 
    options: ExecutionOptions = {}
  ) => {
    try {
      setIsExecuting(true);
      setExecutionResult(null);
      setError(null);

      const defaultOptions: ExecutionOptions = {
        headless: true,
        timeout: 30000,
        browser: 'chromium',
        ...options
      };

      const response = await fetch(`/api/test-cases/${testCaseId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultOptions)
      });

      if (!response.ok) {
        throw new Error(`テスト実行に失敗しました: ${response.statusText}`);
      }

      const result: ExecutionResult = await response.json();
      
      // 結果の検証
      if (!result || typeof result.status === 'undefined') {
        throw new Error('実行結果の形式が不正です');
      }

      setExecutionResult(result);
      onExecutionComplete?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'テストの実行に失敗しました';
      setError(message);
      console.error('テスト実行エラー:', err);
    } finally {
      setIsExecuting(false);
    }
  }, [onExecutionComplete]);

  const clearResult = useCallback(() => {
    setExecutionResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isExecuting,
    executionResult,
    error,
    executeTest,
    clearResult,
    clearError
  };
}