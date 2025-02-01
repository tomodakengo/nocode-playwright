import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">NoCode Playwright</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/projects">
            <div className="p-6 border rounded-lg hover:border-primary transition-colors">
              <h2 className="text-2xl font-semibold mb-2">プロジェクト</h2>
              <p className="text-muted-foreground">
                テストプロジェクトの管理と作成
              </p>
            </div>
          </Link>

          <Link href="/page-objects">
            <div className="p-6 border rounded-lg hover:border-primary transition-colors">
              <h2 className="text-2xl font-semibold mb-2">Page Objects</h2>
              <p className="text-muted-foreground">
                ページオブジェクトの管理とセレクタの設定
              </p>
            </div>
          </Link>

          <Link href="/test-cases">
            <div className="p-6 border rounded-lg hover:border-primary transition-colors">
              <h2 className="text-2xl font-semibold mb-2">テストケース</h2>
              <p className="text-muted-foreground">テストケースの作成と管理</p>
            </div>
          </Link>
        </div>

        <div className="mt-12">
          <Button asChild>
            <Link href="/projects/new">新規プロジェクトを作成</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
