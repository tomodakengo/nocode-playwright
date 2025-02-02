"use client";

import { useEffect, useState } from "react";
import { ActionType, Selector, TestStep } from "@/types";
import {
  validateTestStep,
  formatValidationErrors,
  ensureNumber,
  ensureString,
} from "@/lib/validation";
import { handleApiResponse } from "@/lib/api";

interface TestStepGridProps {
  testCaseId: number;
  onStepUpdate?: (steps: TestStep[]) => void;
}

export default function TestStepGrid({
  testCaseId,
  onStepUpdate,
}: TestStepGridProps) {
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggedStep, setDraggedStep] = useState<TestStep | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actionTypesRes, selectorsRes, stepsRes] = await Promise.all([
          fetch("/api/action-types"),
          fetch("/api/selectors"),
          fetch(`/api/test-cases/${testCaseId}/steps`),
        ]);

        const [actionTypesData, selectorsData, stepsData] = await Promise.all([
          actionTypesRes.json(),
          selectorsRes.json(),
          stepsRes.json(),
        ]);

        setActionTypes(actionTypesData);
        setSelectors(selectorsData);
        setSteps(stepsData);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testCaseId]);

  const handleSave = async (step: TestStep) => {
    try {
      const errors = validateTestStep(step);
      if (errors.length > 0) {
        setError(formatValidationErrors(errors));
        return;
      }

      // データを整形
      const stepData = {
        test_case_id: ensureNumber(testCaseId),
        action_type_id: ensureNumber(step.action_type_id),
        selector_id: ensureNumber(step.selector_id),
        input_value: ensureString(step.input_value),
        assertion_value: ensureString(step.assertion_value),
        description: ensureString(step.description),
        order_index: ensureNumber(step.order_index),
      };

      // 新規作成の場合はPOSTメソッドを使用
      const response = await fetch(`/api/test-cases/${testCaseId}/steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(stepData),
      });

      const createdStep = await handleApiResponse<TestStep>(response);
      const updatedSteps = steps.map((s) => (s.id === -1 ? createdStep : s));
      setSteps(updatedSteps);
      setEditingId(null);
      if (onStepUpdate) {
        onStepUpdate(updatedSteps);
      }
    } catch (error) {
      console.error("ステップ作成エラー:", error);
      setError(
        error instanceof Error ? error.message : "ステップの作成に失敗しました"
      );
    }
  };

  const handleUpdate = async (step: TestStep) => {
    try {
      const errors = validateTestStep(step);
      if (errors.length > 0) {
        setError(formatValidationErrors(errors));
        return;
      }

      // データを整形
      const stepData = {
        test_case_id: ensureNumber(testCaseId),
        action_type_id: ensureNumber(step.action_type_id),
        selector_id: ensureNumber(step.selector_id),
        input_value: ensureString(step.input_value),
        assertion_value: ensureString(step.assertion_value),
        description: ensureString(step.description),
        order_index: ensureNumber(step.order_index),
      };

      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/${step.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(stepData),
        }
      );

      const updatedStep = await handleApiResponse<TestStep>(response);
      const updatedSteps = steps.map((s) =>
        s.id === step.id ? updatedStep : s
      );
      setSteps(updatedSteps);
      setEditingId(null);
      if (onStepUpdate) {
        onStepUpdate(updatedSteps);
      }
    } catch (error) {
      console.error("ステップ更新エラー:", error);
      setError(
        error instanceof Error
          ? error.message
          : "ステップの更新中に予期せぬエラーが発生しました"
      );
    }
  };

  // ステップデータを再取得する共通関数
  const refreshSteps = async () => {
    try {
      const stepsRes = await fetch(`/api/test-cases/${testCaseId}/steps`);
      if (stepsRes.ok) {
        const stepsData = await stepsRes.json();
        setSteps(stepsData);
        return stepsData;
      }
      return null;
    } catch (error) {
      console.error("ステップの再取得に失敗:", error);
      return null;
    }
  };

  const handleAdd = async () => {
    try {
      // バリデーション：アクションタイプが存在することを確認
      if (!actionTypes.length) {
        setError("アクションタイプが設定されていません");
        return;
      }

      // 現在の最大order_indexを取得
      const maxOrderIndex = steps.reduce(
        (max, step) => Math.max(max, step.order_index || 0),
        0
      );

      // 新規ステップを作成（仮のIDを設定）
      const tempStep: TestStep = {
        id: -1, // 仮のID
        test_case_id: Number(testCaseId),
        action_type_id: actionTypes[0]?.id,
        selector_id: null,
        input_value: "",
        assertion_value: "",
        description: "",
        order_index: maxOrderIndex + 1,
      };

      // 編集モードで新規ステップを追加
      setSteps([...steps, tempStep]);
      setEditingId(tempStep.id);
    } catch (error) {
      console.error("ステップ作成エラー:", error);
      setError(
        error instanceof Error
          ? error.message
          : "ステップの作成中に予期せぬエラーが発生しました"
      );
    }
  };

  const handleDelete = async (stepId: number) => {
    if (!confirm("このステップを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/${stepId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      const updatedSteps = steps.filter((s) => s.id !== stepId);
      setSteps(updatedSteps);
      if (onStepUpdate) {
        onStepUpdate(updatedSteps);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "削除に失敗しました");
    }
  };

  const handleDragStart = (step: TestStep) => {
    setDraggedStep(step);
  };

  const handleDragOver = (e: React.DragEvent, targetStep: TestStep) => {
    e.preventDefault();
    if (!draggedStep || draggedStep.id === targetStep.id) return;

    const updatedSteps = [...steps];
    const draggedIndex = steps.findIndex((s) => s.id === draggedStep.id);
    const targetIndex = steps.findIndex((s) => s.id === targetStep.id);

    updatedSteps.splice(draggedIndex, 1);
    updatedSteps.splice(targetIndex, 0, draggedStep);

    setSteps(
      updatedSteps.map((step, index) => ({
        ...step,
        order_index: index + 1,
      }))
    );
  };

  const handleDragEnd = async () => {
    if (!draggedStep) return;
    setDraggedStep(null);

    try {
      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/bulk-update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steps: steps.map((step) => ({
              id: step.id,
              order_index: step.order_index,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("順序の更新に失敗しました");
      }

      const updatedSteps = await response.json();
      setSteps(updatedSteps);
      if (onStepUpdate) {
        onStepUpdate(updatedSteps);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "順序の更新に失敗しました"
      );
      // エラー時は元の順序を復元
      const stepsRes = await fetch(`/api/test-cases/${testCaseId}/steps`);
      const stepsData = await stepsRes.json();
      setSteps(stepsData);
    }
  };

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ステップを追加
        </button>
      </div>

      <div className="border rounded">
        {/* ヘッダー行 */}
        <div className="grid grid-cols-7 gap-2 p-2 bg-gray-100 font-bold border-b">
          <div className="col-span-1">順序</div>
          <div className="col-span-1">アクション</div>
          <div className="col-span-1">セレクタ</div>
          <div className="col-span-1">入力値</div>
          <div className="col-span-1">検証値</div>
          <div className="col-span-1">説明</div>
          <div className="col-span-1">操作</div>
        </div>

        {/* データ行 */}
        {steps.map((step) => (
          <div
            key={step.id}
            draggable
            onDragStart={() => handleDragStart(step)}
            onDragOver={(e) => handleDragOver(e, step)}
            onDragEnd={handleDragEnd}
            className={`grid grid-cols-7 gap-2 p-2 border-b hover:bg-gray-50 ${
              draggedStep?.id === step.id ? "opacity-50 bg-gray-100" : ""
            }`}
          >
            {editingId === step.id ? (
              // 編集モード
              <>
                <div className="col-span-1 flex items-center">
                  {step.order_index}
                </div>
                <div className="col-span-1">
                  <select
                    value={step.action_type_id}
                    onChange={(e) =>
                      setSteps(
                        steps.map((s) =>
                          s.id === step.id
                            ? { ...s, action_type_id: Number(e.target.value) }
                            : s
                        )
                      )
                    }
                    className="w-full p-1 border rounded"
                  >
                    {actionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <select
                    value={step.selector_id || ""}
                    onChange={(e) =>
                      setSteps(
                        steps.map((s) =>
                          s.id === step.id
                            ? {
                                ...s,
                                selector_id: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              }
                            : s
                        )
                      )
                    }
                    className="w-full p-1 border rounded"
                  >
                    <option value="">選択してください</option>
                    {selectors.map((selector) => (
                      <option key={selector.id} value={selector.id}>
                        {selector.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={step.input_value || ""}
                    onChange={(e) =>
                      setSteps(
                        steps.map((s) =>
                          s.id === step.id
                            ? { ...s, input_value: e.target.value }
                            : s
                        )
                      )
                    }
                    className="w-full p-1 border rounded"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={step.assertion_value || ""}
                    onChange={(e) =>
                      setSteps(
                        steps.map((s) =>
                          s.id === step.id
                            ? { ...s, assertion_value: e.target.value }
                            : s
                        )
                      )
                    }
                    className="w-full p-1 border rounded"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={step.description || ""}
                    onChange={(e) =>
                      setSteps(
                        steps.map((s) =>
                          s.id === step.id
                            ? { ...s, description: e.target.value }
                            : s
                        )
                      )
                    }
                    className="w-full p-1 border rounded"
                  />
                </div>
                <div className="col-span-1 flex gap-2">
                  <button
                    onClick={() =>
                      step.id === -1 ? handleSave(step) : handleUpdate(step)
                    }
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      if (step.id === -1) {
                        // 新規作成をキャンセルする場合は、ステップを削除
                        setSteps(steps.filter((s) => s.id !== -1));
                      }
                      setEditingId(null);
                    }}
                    className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              // 表示モード
              <>
                <div className="col-span-1 flex items-center cursor-move">
                  {step.order_index}
                </div>
                <div className="col-span-1">
                  {actionTypes.find((t) => t.id === step.action_type_id)?.name}
                </div>
                <div className="col-span-1">
                  {selectors.find((s) => s.id === step.selector_id)?.name}
                </div>
                <div className="col-span-1">{step.input_value}</div>
                <div className="col-span-1">{step.assertion_value}</div>
                <div className="col-span-1">{step.description}</div>
                <div className="col-span-1 flex gap-2">
                  <button
                    onClick={() => setEditingId(step.id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(step.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
