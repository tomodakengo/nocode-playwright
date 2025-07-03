'use client';

import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { TestStepWithDetails, ExecutionResult } from '@/types';
import { TestStepItem } from './TestStepItem';

interface TestStepListProps {
  steps: TestStepWithDetails[];
  executionResult?: ExecutionResult | null;
  onDragEnd: (result: DropResult) => void;
  onEditStep: (step: TestStepWithDetails) => void;
  onDeleteStep: (stepId: number) => void;
}

export function TestStepList({
  steps,
  executionResult,
  onDragEnd,
  onEditStep,
  onDeleteStep
}: TestStepListProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">🧪</div>
        <p className="text-lg">テストステップがありません</p>
        <p className="mt-2">左のアクションパネルからアクションを追加してください</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="test-steps">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-3 min-h-32 p-4 rounded-lg border-2 border-dashed transition-colors ${
              snapshot.isDraggingOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            {steps.map((step, index) => {
              const stepStatus = executionResult?.steps?.find(
                (s: any) => s.step_id === step.id
              )?.status;
              
              return (
                <TestStepItem
                  key={step.id}
                  step={step}
                  index={index}
                  stepStatus={stepStatus}
                  onEdit={onEditStep}
                  onDelete={onDeleteStep}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}