"use client";

import { useState, useEffect } from "react";
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridToolbarContainer,
  GridRowOrderChangeParams,
  gridRowOrderStateSelector,
  useGridApiRef,
} from "@mui/x-data-grid";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface TestStep {
  id: number;
  action_type_id: number;
  selector_id: number | null;
  input_value: string;
  assertion_value: string;
  description: string;
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

function EditToolbar(props: { onAdd: () => void }) {
  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={props.onAdd}>
        新規ステップ追加
      </Button>
    </GridToolbarContainer>
  );
}

export default function TestStepGrid({
  testCaseId,
  onStepUpdate,
}: TestStepGridProps) {
  const apiRef = useGridApiRef();
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleRowEditStart = (params: any) => {
    setRowModesModel({
      ...rowModesModel,
      [params.id]: { mode: GridRowModes.Edit },
    });
  };

  const handleRowEditStop = (params: any) => {
    setRowModesModel({
      ...rowModesModel,
      [params.id]: { mode: GridRowModes.View },
    });
  };

  const handleEditClick = (id: number) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: number) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleCancelClick = (id: number) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const handleDeleteClick = (id: number) => () => {
    setStepToDelete(id);
    setDeleteDialogOpen(true);
  };

  const validateRow = (newRow: TestStep): boolean => {
    const actionType = actionTypes.find(
      (type) => type.id === newRow.action_type_id
    );
    if (!actionType) return false;

    // セレクタが必要なアクションの場合、セレクタの選択を必須にする
    if (actionType.has_selector && !newRow.selector_id) {
      throw new Error("このアクションにはセレクタの選択が必要です");
    }

    // 入力値が必要なアクションの場合、入力値を必須にする
    if (actionType.has_value && !newRow.input_value) {
      throw new Error("このアクションには入力値が必要です");
    }

    // アサーションが必要なアクションの場合、検証値を必須にする
    if (actionType.has_assertion && !newRow.assertion_value) {
      throw new Error("このアクションには検証値が必要です");
    }

    return true;
  };

  const handleCloseError = () => {
    setError(null);
  };

  const processRowUpdate = async (newRow: TestStep) => {
    try {
      // バリデーションチェック
      if (!validateRow(newRow)) {
        throw new Error("入力内容が不正です");
      }

      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/${newRow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action_type_id: newRow.action_type_id,
            selector_id: newRow.selector_id,
            input_value: newRow.input_value || "",
            assertion_value: newRow.assertion_value || "",
            description: newRow.description || "",
            order_index: newRow.order_index,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ステップの更新に失敗しました");
      }

      const updatedStep = await response.json();
      // 更新が成功したら親コンポーネントに通知
      if (onStepUpdate) {
        onStepUpdate(updatedStep);
      }
      return updatedStep;
    } catch (error) {
      console.error("更新エラー:", error);
      setError(
        error instanceof Error ? error.message : "ステップの更新に失敗しました"
      );
      throw error;
    }
  };

  const handleRowOrderChange = async (params: GridRowOrderChangeParams) => {
    try {
      const newSteps = [...steps];
      const movedStep = newSteps.splice(params.oldIndex, 1)[0];
      newSteps.splice(params.targetIndex, 0, movedStep);

      // 順序を更新
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        order_index: index + 1,
      }));

      // 一時的に新しい順序を反映
      setSteps(updatedSteps);

      // 一括更新APIを呼び出し
      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/reorder`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSteps),
        }
      );

      if (!response.ok) {
        throw new Error("ステップの順序更新に失敗しました");
      }

      // 成功した場合はAPIからの応答で更新
      const result = await response.json();
      if (Array.isArray(result)) {
        setSteps(result);
      }
    } catch (error) {
      console.error("順序更新エラー:", error);
      setError("ステップの順序更新に失敗しました");
      // エラー時は元の順序に戻す
      const response = await fetch(`/api/test-cases/${testCaseId}/steps`);
      const originalSteps = await response.json();
      setSteps(originalSteps);
    }
  };

  const handleDeleteConfirm = async () => {
    if (stepToDelete === null) return;

    try {
      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/${stepToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("ステップの削除に失敗しました");
      }

      setSteps(steps.filter((step) => step.id !== stepToDelete));
    } catch (error) {
      console.error("削除エラー:", error);
      setError("ステップの削除に失敗しました");
    } finally {
      setDeleteDialogOpen(false);
      setStepToDelete(null);
    }
  };

  const handleAddClick = async () => {
    const newStep = {
      action_type_id: actionTypes[0].id,
      selector_id: null,
      input_value: "",
      assertion_value: "",
      description: "",
      order_index: steps.length + 1,
    };

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}/steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStep),
      });

      if (!response.ok) {
        throw new Error("ステップの作成に失敗しました");
      }

      const data = await response.json();
      const createdStep = { ...newStep, id: data.id };
      setSteps([...steps, createdStep]);
      setRowModesModel({
        ...rowModesModel,
        [data.id]: { mode: GridRowModes.Edit },
      });
    } catch (error) {
      console.error("作成エラー:", error);
      setError("ステップの作成に失敗しました");
    }
  };

  const handleProcessRowUpdateError = (error: Error) => {
    setError(error.message);
  };

  const columns: GridColDef[] = [
    {
      field: "drag_indicator",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      hideable: false,
      disableColumnMenu: true,
      disableReorder: true,
      renderCell: () => (
        <Tooltip title="ドラッグして順序を変更">
          <div className="flex items-center justify-center w-full h-full cursor-move">
            <DragIndicatorIcon />
          </div>
        </Tooltip>
      ),
    },
    {
      field: "order_index",
      headerName: "順序",
      width: 70,
      editable: false,
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
        description: type.description,
      })),
      renderCell: (params) => {
        const actionType = actionTypes.find((type) => type.id === params.value);
        return (
          <Tooltip title={actionType?.description || ""}>
            <span>{actionType?.name || ""}</span>
          </Tooltip>
        );
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
      valueFormatter: (params) => params.value || null,
    },
    {
      field: "input_value",
      headerName: "入力値",
      width: 150,
      editable: true,
      valueFormatter: (params) => params.value || "",
    },
    {
      field: "assertion_value",
      headerName: "検証値",
      width: 150,
      editable: true,
      valueFormatter: (params) => params.value || "",
    },
    {
      field: "description",
      headerName: "説明",
      width: 200,
      editable: true,
      valueFormatter: (params) => params.value || "",
    },
    {
      field: "actions",
      type: "actions",
      headerName: "操作",
      width: 100,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key="save"
              icon={<SaveIcon />}
              label="保存"
              onClick={handleSaveClick(id as number)}
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon />}
              label="キャンセル"
              className="textPrimary"
              onClick={handleCancelClick(id as number)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="編集"
            className="textPrimary"
            onClick={handleEditClick(id as number)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="削除"
            onClick={handleDeleteClick(id as number)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="h-[600px] w-full">
      <DataGrid
        rows={steps}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
        onRowEditStart={handleRowEditStart}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        rowReordering
        onRowOrderChange={handleRowOrderChange}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { onAdd: handleAddClick },
        }}
        apiRef={apiRef}
        disableRowSelectionOnClick
        getRowClassName={() => "cursor-move"}
        sx={{
          "& .MuiDataGrid-row": {
            cursor: "move",
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
        }}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
            },
          },
        }}
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>ステップの削除</DialogTitle>
        <DialogContent>このステップを削除してもよろしいですか？</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* エラーメッセージ表示 */}
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}
