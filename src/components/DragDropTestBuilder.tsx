"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  PlayIcon, 
  PlusIcon, 
  TrashIcon, 
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@mui/icons-material';
import { ActionType, TestStep, Selector } from '@/types';

interface DragDropTestBuilderProps {
  testCaseId: number;
  onTestExecute?: (result: any) => void;
}

interface TestStepWithDetails extends TestStep {
  actionTypeName?: string;
  selectorName?: string;
  actionDescription?: string;
}

const DragDropTestBuilder: React.FC<DragDropTestBuilderProps> = ({ 
  testCaseId, 
  onTestExecute 
}) => {
  const [steps, setSteps] = useState<TestStepWithDetails[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [selectedStep, setSelectedStep] = useState<TestStepWithDetails | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [testCaseId]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newSteps = Array.from(steps);
    const [reorderedItem] = newSteps.splice(result.source.index, 1);
    newSteps.splice(result.destination.index, 0, reorderedItem);

    // 順序インデックスを更新
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      order_index: index + 1
    }));

    setSteps(updatedSteps);
    updateStepOrder(updatedSteps);
  };

  const updateStepOrder = async (updatedSteps: TestStepWithDetails[]) => {
    try {
      await fetch(`/api/test-cases/${testCaseId}/steps/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: updatedSteps.map(step => ({
            id: step.id,
            order_index: step.order_index
          }))
        })
      });
    } catch (err) {
      setError('順序の更新に失敗しました');
    }
  };

  const executeTest = async () => {
    if (steps.length === 0) {
      setError('実行するステップがありません');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);
    setError(null);

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headless: true, timeout: 30000 })
      });

      const result = await response.json();
      setExecutionResult(result);
      
      if (onTestExecute) {
        onTestExecute(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'テストの実行に失敗しました');
    } finally {
      setIsExecuting(false);
    }
  };

  const addNewStep = (actionType: ActionType) => {
    const newStep: TestStepWithDetails = {
      id: Date.now(), // 仮のID
      test_case_id: testCaseId,
      action_type_id: actionType.id,
      selector_id: null,
      input_value: '',
      assertion_value: '',
      description: '',
      order_index: steps.length + 1,
      actionTypeName: actionType.name,
      actionDescription: actionType.description
    };
    
    setSelectedStep(newStep);
    setShowActionPanel(true);
  };

  const deleteStep = async (stepId: number) => {
    if (!confirm('このステップを削除してもよろしいですか？')) return;

    try {
      await fetch(`/api/test-cases/${testCaseId}/steps/${stepId}`, {
        method: 'DELETE'
      });
      setSteps(steps.filter(step => step.id !== stepId));
    } catch (err) {
      setError('ステップの削除に失敗しました');
    }
  };

  const getStepIcon = (actionName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'click': '👆',
      'type': '⌨️',
      'fill': '📝',
      'navigate': '🌐',
      'wait': '⏱️',
      'assert_visible': '👁️',
      'assert_text': '📄',
      'hover': '🖱️',
      'screenshot': '📸',
      'scroll_into_view': '📜',
      'press': '⚡',
      'check': '✅',
      'uncheck': '❌',
      'select_option': '📋',
    };
    return iconMap[actionName] || '🔧';
  };

  const getStepStatusColor = (status?: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 border-green-500 text-green-800';
      case 'failed': return 'bg-red-100 border-red-500 text-red-800';
      case 'skipped': return 'bg-gray-100 border-gray-400 text-gray-600';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="読み込み中">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="sr-only">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* ヘッダーセクション */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            テストケースビルダー
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowActionPanel(!showActionPanel)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="新しいアクションを追加"
            >
              <PlusIcon className="w-5 h-5" />
              アクション追加
            </button>
            <button
              onClick={executeTest}
              disabled={isExecuting || steps.length === 0}
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
          <span>ステップ数: {steps.length}</span>
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

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* アクションパネル */}
        {showActionPanel && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                利用可能なアクション
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {actionTypes.map((actionType) => (
                  <button
                    key={actionType.id}
                    onClick={() => addNewStep(actionType)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors group"
                    aria-label={`${actionType.name}アクションを追加`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" role="img" aria-hidden="true">
                        {getStepIcon(actionType.name)}
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
        )}

        {/* メインテストエリア */}
        <div className={showActionPanel ? "lg:col-span-3" : "lg:col-span-4"}>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              テストステップ
            </h2>
            
            {steps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🧪</div>
                <p className="text-lg">テストステップがありません</p>
                <p className="mt-2">左のアクションパネルからアクションを追加してください</p>
              </div>
            ) : (
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
                                    : getStepStatusColor(stepStatus)
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
                                      {getStepIcon(step.actionTypeName || '')}
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
                                      onClick={() => {
                                        setSelectedStep(step);
                                        setShowActionPanel(true);
                                      }}
                                      className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                      aria-label="ステップを編集"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteStep(step.id)}
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
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>

      {/* 実行結果の詳細 */}
      {executionResult && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            実行結果
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {executionResult.duration}ms
              </div>
              <div className="text-sm text-gray-600">実行時間</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {executionResult.steps?.filter((s: any) => s.status === 'passed').length || 0}
              </div>
              <div className="text-sm text-gray-600">成功ステップ</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {executionResult.steps?.filter((s: any) => s.status === 'failed').length || 0}
              </div>
              <div className="text-sm text-gray-600">失敗ステップ</div>
            </div>
          </div>
          
          {executionResult.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">エラー詳細</h3>
              <p className="text-red-700">{executionResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DragDropTestBuilder;