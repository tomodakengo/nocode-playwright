"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TestCaseRedirect({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  useEffect(() => {
    // テストスイートIDを取得するためのAPI呼び出し
    const fetchTestCase = async () => {
      try {
        const response = await fetch(`/api/test-cases/${params.id}`);
        if (!response.ok) {
          throw new Error("テストケースの取得に失敗しました");
        }
        const testCase = await response.json();
        router.push(
          `/test-suites/${testCase.test_suite_id}/test-cases/${params.id}`
        );
      } catch (error) {
        console.error("エラー:", error);
      }
    };

    fetchTestCase();
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">リダイレクト中...</p>
    </div>
  );
}
