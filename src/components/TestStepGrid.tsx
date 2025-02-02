"use client";

import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Select, MenuItem, TextField } from "@mui/material";

interface TestStep {
  id: number;
  action_type_id: number;
  selector_id: number | null;
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

interface Selector {
  id: number;
  name: string;
  selector_type: string;
  selector_value: string;
}

interface TestStepGridProps {
  testCaseId: string;
  onStepUpdate?: (step: TestStep) => void;
}

export default function TestStepGrid({
  testCaseId,
  onStepUpdate,
}: TestStepGridProps) {
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // アクションタイプの取得
        const actionTypesResponse = await fetch("/api/action-types");
        const actionTypesData = await actionTypesResponse.json();
        setActionTypes(actionTypesData);

        // セレクタの取得
        const selectorsResponse = await fetch("/api/selectors");
        const selectorsData = await selectorsResponse.json();
        setSelectors(selectorsData);

        // テストステップの取得
        const stepsResponse = await fetch(
          `/api/test-cases/${testCaseId}/steps`
        );
        const stepsData = await stepsResponse.json();
        setSteps(stepsData);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testCaseId]);

  const handleCellEdit = async (params: any) => {
    const updatedStep = {
      ...steps.find((step) => step.id === params.id),
      [params.field]: params.value,
    };

    try {
      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedStep),
        }
      );

      if (!response.ok) {
        throw new Error("ステップの更新に失敗しました");
      }

      setSteps(
        steps.map((step) => (step.id === params.id ? updatedStep : step))
      );

      if (onStepUpdate) {
        onStepUpdate(updatedStep);
      }
    } catch (error) {
      console.error("更新エラー:", error);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "order_index",
      headerName: "順序",
      width: 70,
      editable: true,
      type: "number",
    },
    {
      field: "action_type_id",
      headerName: "アクション",
      width: 150,
      editable: true,
      type: "singleSelect",
      valueOptions: actionTypes.map((type) => ({
        value: type.id,
        label: type.name,
      })),
      renderCell: (params) => {
        const actionType = actionTypes.find((type) => type.id === params.value);
        return actionType?.name || "";
      },
    },
    {
      field: "selector_id",
      headerName: "セレクタ",
      width: 200,
      editable: true,
      type: "singleSelect",
      valueOptions: selectors.map((selector) => ({
        value: selector.id,
        label: `${selector.name} (${selector.selector_value})`,
      })),
      renderCell: (params) => {
        const selector = selectors.find((s) => s.id === params.value);
        return selector ? `${selector.name} (${selector.selector_value})` : "";
      },
    },
    {
      field: "input_value",
      headerName: "入力値",
      width: 150,
      editable: true,
    },
    {
      field: "assertion_value",
      headerName: "検証値",
      width: 150,
      editable: true,
    },
    {
      field: "description",
      headerName: "説明",
      width: 200,
      editable: true,
    },
  ];

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={steps}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        disableSelectionOnClick
        onCellEditCommit={handleCellEdit}
      />
    </div>
  );
}
