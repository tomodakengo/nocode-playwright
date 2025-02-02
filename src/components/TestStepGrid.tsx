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
} from "@mui/x-data-grid";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";

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
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [selectors, setSelectors] = useState<Selector[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);

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

  const processRowUpdate = async (newRow: GridRowModel) => {
    try {
      const response = await fetch(
        `/api/test-cases/${testCaseId}/steps/${newRow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRow),
        }
      );

      if (!response.ok) {
        throw new Error("ステップの更新に失敗しました");
      }

      const updatedRow = { ...newRow, isNew: false };
      setSteps(steps.map((row) => (row.id === newRow.id ? updatedRow : row)));
      return updatedRow;
    } catch (error) {
      console.error("更新エラー:", error);
      throw error;
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
    } finally {
      setDeleteDialogOpen(false);
      setStepToDelete(null);
    }
  };

  const handleAddClick = async () => {
    const newStep = {
      action_type_id: actionTypes[0].id,
      selector_id: null,
      input_value: null,
      assertion_value: null,
      description: null,
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
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { onAdd: handleAddClick },
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
    </div>
  );
}
