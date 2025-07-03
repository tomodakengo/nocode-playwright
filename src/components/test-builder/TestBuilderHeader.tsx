'use client';

import React from 'react';
import { PlayArrow as PlayIcon, Add as PlusIcon } from '@mui/icons-material';
import { ExecutionResult } from '@/types';

interface TestBuilderHeaderProps {
  stepCount: number;
  executionResult?: ExecutionResult | null;
  isExecuting: boolean;
  onAddAction: () => void;
  onExecuteTest: () => void;
}

export function TestBuilderHeader({
  stepCount,
  executionResult,
  isExecuting,
  onAddAction,
  onExecuteTest
}: TestBuilderHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          テストケースビルダー
        </h1>
        <div className="flex gap-3">
          <button
            onClick={onAddAction}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="新しいアクションを追加"
          >
            <PlusIcon className="w-5 h-5" />
            アクション追加
          </button>
          <button
            onClick={onExecuteTest}
            disabled={isExecuting || stepCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            aria-label="テストを実行"
          >
            <PlayIcon className="w-5 h-5" />
            {isExecuting ? '実行中...' : 'テスト実行'}
          </button>
        </div>
      </div>
      
      {/* ステップ数とステータス */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span>ステップ数: {stepCount}</span>
        {executionResult && (
          <span className={`px-2 py-1 rounded ${
            executionResult.status === 'passed' ? 'bg-green-100 text-green-800' :
            executionResult.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {executionResult.status === 'passed' ? '✅ 成功' : 
             executionResult.status === 'failed' ? '❌ 失敗' : '⚠️ エラー'}
          </span>
        )}
      </div>
    </div>
  );
}