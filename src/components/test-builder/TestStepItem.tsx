'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { PencilIcon, TrashIcon } from '@mui/icons-material';
import { TestStepWithDetails } from '@/types';
import { getActionIcon, getStatusColor } from '@/lib/utils';

interface TestStepItemProps {
  step: TestStepWithDetails;
  index: number;
  stepStatus?: string;
  onEdit: (step: TestStepWithDetails) => void;
  onDelete: (stepId: number) => void;
}

export function TestStepItem({ 
  step, 
  index, 
  stepStatus, 
  onEdit, 
  onDelete 
}: TestStepItemProps) {
  return (
    <Draggable
      key={step.id}
      draggableId={step.id.toString()}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-4 bg-white rounded-lg border-2 shadow-sm transition-all ${
            snapshot.isDragging 
              ? 'shadow-lg scale-105 border-blue-400' 
              : getStatusColor(stepStatus)
          }`}
          role="listitem"
          aria-label={`ステップ ${index + 1}: ${step.actionTypeName}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                {...provided.dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                aria-label="ドラッグハンドル"
              >
                ⋮⋮
              </div>
              <span className="text-2xl" role="img" aria-hidden="true">
                {getActionIcon(step.actionTypeName || '')}
              </span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {step.actionTypeName}
                </div>
                {step.selectorName && (
                  <div className="text-sm text-gray-600">
                    セレクタ: {step.selectorName}
                  </div>
                )}
                {step.input_value && (
                  <div className="text-sm text-gray-600">
                    入力値: {step.input_value}
                  </div>
                )}
                {step.description && (
                  <div className="text-sm text-gray-600">
                    説明: {step.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(step)}
                className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="ステップを編集"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(step.id)}
                className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                aria-label="ステップを削除"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}