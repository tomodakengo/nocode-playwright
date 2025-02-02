"use client";

import { useState } from "react";
import TestStepGrid from "@/components/TestStepGrid";
import { Button } from "@mui/material";

export default function TestStepsPage({ params }: { params: { id: string } }) {
  const [showPreview, setShowPreview] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");

  const handleGenerateCode = async () => {
    try {
      const response = await fetch(`/api/test-cases/${params.id}/generate`);
      if (!response.ok) {
        throw new Error("コードの生成に失敗しました");
      }
      const data = await response.json();
      setGeneratedCode(data.code);
      setShowPreview(true);
    } catch (error) {
      console.error("コード生成エラー:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">テストステップ編集</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateCode}
        >
          Playwrightコードを生成
        </Button>
      </div>

      <TestStepGrid testCaseId={params.id} />

      {showPreview && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">生成されたコード</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{generatedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
