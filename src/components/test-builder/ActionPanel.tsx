'use client';

import React from 'react';
import { ActionType } from '@/types';
import { getActionIcon } from '@/lib/utils';

interface ActionPanelProps {
  actionTypes: ActionType[];
  onActionSelect: (actionType: ActionType) => void;
  isVisible: boolean;
}

export function ActionPanel({ actionTypes, onActionSelect, isVisible }: ActionPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          利用可能なアクション
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {actionTypes.map((actionType) => (
            <button
              key={actionType.id}
              onClick={() => onActionSelect(actionType)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors group"
              aria-label={`${actionType.name}アクションを追加`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {getActionIcon(actionType.name)}
                </span>
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-blue-900">
                    {actionType.name}
                  </div>
                  <div className="text-sm text-gray-600 group-hover:text-blue-700">
                    {actionType.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}