'use client';

import React from 'react';
import { ExecutionResult } from '@/types';
import { formatDuration } from '@/lib/utils';

interface ExecutionResultProps {
  result: ExecutionResult;
}

export function ExecutionResultDisplay({ result }: ExecutionResultProps) {
  if (!result) return null;

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        実行結果
      </h2>
      
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(result.duration)}
          </div>
          <div className="text-sm text-gray-600">実行時間</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {result.steps?.filter((s: any) => s.status === 'passed').length || 0}
          </div>
          <div className="text-sm text-gray-600">成功ステップ</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {result.steps?.filter((s: any) => s.status === 'failed').length || 0}
          </div>
          <div className="text-sm text-gray-600">失敗ステップ</div>
        </div>
      </div>

      {/* 実行ステータス */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
          result.status === 'passed' ? 'bg-green-100 text-green-800' :
          result.status === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {result.status === 'passed' ? '✅ 成功' : 
           result.status === 'failed' ? '❌ 失敗' : '⚠️ エラー'}
        </span>
      </div>
      
      {/* エラー詳細 */}
      {result.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-2">エラー詳細</h3>
          <p className="text-red-700 text-sm">{result.error}</p>
        </div>
      )}

      {/* スクリーンショット */}
      {result.screenshots && result.screenshots.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium text-gray-800 mb-2">スクリーンショット</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.screenshots.map((screenshot, index) => (
              <div key={index} className="relative">
                <img
                  src={screenshot}
                  alt={`スクリーンショット ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.open(screenshot, '_blank')}
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}