import { PageObjectService } from "@/lib/services/pageObjectService";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function PageObjects() {
  const pageObjects = await PageObjectService.getAllPageObjects();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Page Objects</h1>
          <Button asChild>
            <Link href="/page-objects/new">新規作成</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pageObjects.map((pageObject) => (
            <Link
              key={pageObject.id}
              href={`/page-objects/${pageObject.id}`}
              className="block"
            >
              <div className="p-6 border rounded-lg hover:border-primary transition-colors">
                <h2 className="text-2xl font-semibold mb-2">
                  {pageObject.name}
                </h2>
                <p className="text-muted-foreground mb-4">{pageObject.url}</p>
                <div className="text-sm text-muted-foreground">
                  {JSON.parse(pageObject.selectors as string).length} セレクタ
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
