import Link from "next/link";

import { PaletteTrigger } from "@/components/command-palette";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/60 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-baseline gap-3">
          <span className="flex items-baseline gap-2">
            <span className="size-2 rounded-full bg-primary/70" />
            <span className="font-mono text-base font-medium tracking-tight text-foreground">
              Idea Incubator
            </span>
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            把模糊想法，养成能落地的样子
          </span>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/board"
              className="transition-colors hover:text-foreground"
            >
              看板
            </Link>
            <Link
              href="/graph"
              className="transition-colors hover:text-foreground"
            >
              图谱
            </Link>
            <Link
              href="/review"
              className="transition-colors hover:text-foreground"
            >
              周回顾
            </Link>
          </nav>
          <PaletteTrigger />
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/70">
            v1.7
          </span>
        </div>
      </div>
    </header>
  );
}
