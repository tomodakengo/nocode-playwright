import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-8">NoCode Playwright</h1>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link
              href="/test-suites"
              className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                isActive("/test-suites") ? "bg-gray-700" : ""
              }`}
            >
              テストスイート
            </Link>
          </li>
          <li>
            <Link
              href="/test-cases"
              className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                isActive("/test-cases") ? "bg-gray-700" : ""
              }`}
            >
              テストケース
            </Link>
          </li>
          <li>
            <Link
              href="/pages"
              className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                isActive("/pages") ? "bg-gray-700" : ""
              }`}
            >
              ページ管理
            </Link>
            {isActive("/pages") && (
              <ul className="ml-4 mt-2 space-y-2">
                <li>
                  <Link
                    href="/pages/new"
                    className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                      pathname === "/pages/new" ? "bg-gray-700" : ""
                    }`}
                  >
                    新規ページ作成
                  </Link>
                </li>
                {pathname?.match(/^\/pages\/\d+$/) && (
                  <li>
                    <Link
                      href={`${pathname}/selectors`}
                      className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                        pathname?.includes("/selectors") ? "bg-gray-700" : ""
                      }`}
                    >
                      セレクタ管理
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
          <li>
            <Link
              href="/settings"
              className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                isActive("/settings") ? "bg-gray-700" : ""
              }`}
            >
              設定
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
