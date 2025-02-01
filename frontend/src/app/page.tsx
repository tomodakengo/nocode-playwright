"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { getProjects } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            NoCode Playwright Test Generator
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            ブラウザ操作を記録するだけで、Playwrightのテストコードを自動生成します。
            コーディング不要で、簡単にE2Eテストを作成できます。
          </p>
          <div className="space-x-4">
            <Link href="/projects/new">
              <Button size="lg">新規プロジェクト作成</Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" size="lg">
                プロジェクト一覧
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
