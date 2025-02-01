export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* テストスイートの概要 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">テストスイート</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">総数</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">最近の追加</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        </div>

        {/* テストケースの概要 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">テストケース</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">総数</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">成功率</span>
              <span className="font-semibold">-</span>
            </div>
          </div>
        </div>

        {/* セレクタの概要 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">セレクタ</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">登録数</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ページ数</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* 最近の実行履歴 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">最近の実行履歴</h2>
        <div className="border rounded-lg">
          <div className="px-4 py-3 text-gray-500 text-sm border-b bg-gray-50">
            実行履歴はありません
          </div>
        </div>
      </div>
    </div>
  );
}
