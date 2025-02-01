"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface TestStep {
  id: number;
  action_type: string;
  action_type_id: number;
  has_value: number;
  has_selector: number;
  has_assertion: number;
  selector_id: number | null;
  selector_name: string | null;
  selector_type: string | null;
  selector_value: string | null;
  input_value: string | null;
  assertion_value: string | null;
  description: string | null;
  order_index: number;
}

interface ActionType {
  id: number;
  name: string;
  description: string;
  has_value: number;
  has_selector: number;
  has_assertion: number;
}

interface TestStepListProps {
  testCaseId: string;
  onStepSelect?: (step: TestStep) => void;
}

const TestStepList = ({ testCaseId, onStepSelect }: TestStepListProps) => {
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // アクションタイプの取得
        const actionTypesResponse = await fetch("/api/action-types");
        if (!actionTypesResponse.ok) {
          throw new Error("アクションタイプの取得に失敗しました");
        }
        const actionTypesData = await actionTypesResponse.json();
        setActionTypes(actionTypesData);

        // テストステップの取得
        const stepsResponse = await fetch(
          `/api/test-cases/${testCaseId}/steps`
        );
        if (!stepsResponse.ok) {
          throw new Error("テストステップの取得に失敗しました");
        }
        const stepsData = await stepsResponse.json();
        setSteps(stepsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testCaseId]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 順序インデックスを更新
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    setSteps(updatedItems);

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}/steps`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          updatedItems.map((item) => ({
            id: item.id,
            order_index: item.order_index,
          }))
        ),
      });

      if (!response.ok) {
        throw new Error("テストステップの順序の更新に失敗しました");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    }
  };

  const handleDelete = async (stepId: number) => {
    if (!confirm("このテストステップを削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/${stepId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("テストステップの削除に失敗しました");
      }

      setSteps((prev) => prev.filter((step) => step.id !== stepId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="test-steps">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {steps.map((step, index) => (
                <Draggable
                  key={step.id}
                  draggableId={String(step.id)}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">#{index + 1}</span>
                            <span className="font-medium">
                              {step.action_type}
                            </span>
                          </div>
                          {step.selector_name && (
                            <p className="text-sm text-gray-600 mt-1">
                              セレクタ: {step.selector_name} (
                              {step.selector_value})
                            </p>
                          )}
                          {step.input_value && (
                            <p className="text-sm text-gray-600">
                              入力値: {step.input_value}
                            </p>
                          )}
                          {step.assertion_value && (
                            <p className="text-sm text-gray-600">
                              検証値: {step.assertion_value}
                            </p>
                          )}
                          {step.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {step.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onStepSelect?.(step)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(step.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {steps.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">テストステップがありません</p>
        </div>
      )}
    </div>
  );
};

export default TestStepList;
