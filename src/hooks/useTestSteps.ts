import { useState, useEffect, useCallback } from 'react';
import { TestStep, TestStepWithDetails, ActionType, Selector, ApiResponse } from '@/types';
import { validateTestStep, formatValidationErrors } from '@/lib/validation';

interface UseTestStepsOptions {
  testCaseId: number;
  onStepUpdate?: (steps: TestStep[]) => void;
}

interface UseTestStepsReturn {
  steps: TestStepWithDetails[];
  actionTypes: ActionType[];
  selectors: Selector[];
  loading: boolean;
  error: string | null;
  addStep: () => Promise<void>;
  updateStep: (step: TestStep) => Promise<void>;
  deleteStep: (stepId: number) => Promise<void>;
  reorderSteps: (reorderedSteps: TestStep[]) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export function useTestSteps({ 
  testCaseId, 
  onStepUpdate 
}: UseTestStepsOptions): UseTestStepsReturn {
  const [steps, setSteps] = useState<TestStepWithDetails[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [actionTypesRes, selectorsRes, stepsRes] = await Promise.all([
        fetch('/api/action-types'),
        fetch('/api/selectors'),
        fetch(`/api/test-cases/${testCaseId}/steps`)
      ]);

      if (!actionTypesRes.ok || !selectorsRes.ok || !stepsRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [actionTypesData, selectorsData, stepsData] = await Promise.all([
        actionTypesRes.json(),
        selectorsRes.json(),
        stepsRes.json()
      ]);

      // データの型チェック
      if (!Array.isArray(actionTypesData) || !Array.isArray(selectorsData) || !Array.isArray(stepsData)) {
        throw new Error('データ形式が不正です');
      }

      setActionTypes(actionTypesData);
      setSelectors(selectorsData);
      
      // ステップにアクションタイプ名とセレクタ名を追加
      const enrichedSteps = stepsData.map((step: TestStep) => ({
        ...step,
        actionTypeName: actionTypesData.find((at: ActionType) => at.id === step.action_type_id)?.name,
        selectorName: selectorsData.find((s: Selector) => s.id === step.selector_id)?.name,
        actionDescription: actionTypesData.find((at: ActionType) => at.id === step.action_type_id)?.description
      }));
      
      setSteps(enrichedSteps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(message);
      console.error('データ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [testCaseId]);

  const addStep = useCallback(async () => {
    try {
      if (!actionTypes.length) {
        setError('アクションタイプが設定されていません');
        return;
      }

      const maxOrderIndex = steps.length > 0 
        ? Math.max(...steps.map(step => step.order_index || 0))
        : 0;

      const newStep: TestStep = {
        id: Date.now(), // 仮のID
        test_case_id: testCaseId,
        action_type_id: actionTypes[0].id,
        selector_id: null,
        input_value: '',
        assertion_value: '',
        description: '',
        order_index: maxOrderIndex + 1,
      };

      const response = await fetch(`/api/test-cases/${testCaseId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStep)
      });

      if (!response.ok) {
        throw new Error('ステップの作成に失敗しました');
      }

      const createdStep = await response.json();
      const enrichedStep = {
        ...createdStep,
        actionTypeName: actionTypes.find(at => at.id === createdStep.action_type_id)?.name,
        selectorName: selectors.find(s => s.id === createdStep.selector_id)?.name,
        actionDescription: actionTypes.find(at => at.id === createdStep.action_type_id)?.description
      };

      const updatedSteps = [...steps, enrichedStep];
      setSteps(updatedSteps);
      onStepUpdate?.(updatedSteps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ステップの作成に失敗しました';
      setError(message);
    }
  }, [testCaseId, actionTypes, selectors, steps, onStepUpdate]);

  const updateStep = useCallback(async (step: TestStep) => {
    try {
      const actionType = actionTypes.find(at => at.id === step.action_type_id);
      const errors = validateTestStep(step, actionType);
      
      if (errors.length > 0) {
        setError(formatValidationErrors(errors));
        return;
      }

      const response = await fetch(`/api/test-cases/${testCaseId}/steps/${step.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step)
      });

      if (!response.ok) {
        throw new Error('ステップの更新に失敗しました');
      }

      const updatedStep = await response.json();
      const enrichedStep = {
        ...updatedStep,
        actionTypeName: actionTypes.find(at => at.id === updatedStep.action_type_id)?.name,
        selectorName: selectors.find(s => s.id === updatedStep.selector_id)?.name,
        actionDescription: actionTypes.find(at => at.id === updatedStep.action_type_id)?.description
      };

      const updatedSteps = steps.map(s => s.id === step.id ? enrichedStep : s);
      setSteps(updatedSteps);
      onStepUpdate?.(updatedSteps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ステップの更新に失敗しました';
      setError(message);
    }
  }, [testCaseId, actionTypes, selectors, steps, onStepUpdate]);

  const deleteStep = useCallback(async (stepId: number) => {
    try {
      const response = await fetch(`/api/test-cases/${testCaseId}/steps/${stepId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('ステップの削除に失敗しました');
      }

      const updatedSteps = steps.filter(s => s.id !== stepId);
      setSteps(updatedSteps);
      onStepUpdate?.(updatedSteps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ステップの削除に失敗しました';
      setError(message);
    }
  }, [testCaseId, steps, onStepUpdate]);

  const reorderSteps = useCallback(async (reorderedSteps: TestStep[]) => {
    try {
      const response = await fetch(`/api/test-cases/${testCaseId}/steps/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: reorderedSteps.map((step, index) => ({
            id: step.id,
            order_index: index + 1
          }))
        })
      });

      if (!response.ok) {
        throw new Error('順序の更新に失敗しました');
      }

      // 順序を更新
      const updatedSteps = reorderedSteps.map((step, index) => ({
        ...step,
        order_index: index + 1
      }));

      setSteps(updatedSteps);
      onStepUpdate?.(updatedSteps);
    } catch (err) {
      const message = err instanceof Error ? err.message : '順序の更新に失敗しました';
      setError(message);
      // エラー時は元の順序を復元
      await fetchData();
    }
  }, [testCaseId, onStepUpdate, fetchData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    steps,
    actionTypes,
    selectors,
    loading,
    error,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    refreshData: fetchData,
    clearError
  };
}