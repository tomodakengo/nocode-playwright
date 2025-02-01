"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  getTestSuite,
  getTestCases,
  getProjectStatistics,
} from "@/services/api";
import { Button } from "@/components/ui/Button";

export default function TestSuiteDetailPage() {
  const params = useParams();
  const testSuiteId = Number(params.id);

  const { data: testSuite, isLoading: isLoadingTestSuite } = useQuery({
    queryKey: ["testSuite", testSuiteId],
    queryFn: () => getTestSuite(testSuiteId),
  });

  const { data: testCases, isLoading: isLoadingTestCases } = useQuery({
    queryKey: ["testCases", testSuiteId],
    queryFn: () => getTestCases(testSuiteId),
  });

  const { data: statistics, isLoading: isLoadingStatistics } = useQuery({
    queryKey: ["statistics", testSuite?.project_id, testSuiteId],
    queryFn: () =>
      testSuite
        ? getProjectStatistics(testSuite.project_id, testSuiteId)
        : null,
    enabled: !!testSuite,
  });

  if (isLoadingTestSuite || isLoadingTestCases || isLoadingStatistics) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {testSuite?.name}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{testSuite?.description}</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link href={`/test-suites/${testSuiteId}/edit`}>
            <Button variant="outline" className="ml-3">
              編集
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-md bg-indigo-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">TC</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    テストケース数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {testCases?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-md bg-green-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">SR</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    成功率
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics
                      ? `${Math.round(statistics.success_rate)}%`
                      : "-"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-md bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">EX</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    総実行回数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics?.total_executions || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              テストケース
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              テストスイートに含まれるテストケースの一覧です。
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link href={`/test-suites/${testSuiteId}/test-cases/new`}>
              <Button>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                新規作成
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        テストケース名
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        優先度
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        ステップ数
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        有効/無効
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        作成日
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {testCases?.map((testCase) => (
                      <tr key={testCase.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link
                            href={`/test-cases/${testCase.id}`}
                            className="hover:text-indigo-600"
                          >
                            {testCase.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {testCase.priority}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {testCase.steps.length}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {testCase.is_enabled ? "有効" : "無効"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(
                            new Date(testCase.created_at),
                            "yyyy/MM/dd HH:mm"
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/test-cases/${testCase.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            編集
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
