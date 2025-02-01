export default function Home() {
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-2xl font-bold mb-4">NoCode Playwrightへようこそ</h2>
        <p className="text-gray-600 mb-4">
          このツールを使用して、コードを書かずにPlaywrightのテストを作成・管理できます。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">テストスイート管理</h3>
            <p className="text-gray-600">
              テストケースをグループ化し、効率的にテストを管理します。
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">セレクタ管理</h3>
            <p className="text-gray-600">
              ページ要素のセレクタを簡単に管理し、再利用できます。
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">テスト実行・レポート</h3>
            <p className="text-gray-600">
              テストを実行し、結果を分かりやすく表示します。
            </p>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/test-suites"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            テストスイートを作成する
          </a>
        </div>
      </div>
    </div>
  );
}
