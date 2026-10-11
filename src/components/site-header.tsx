import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/70 bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm tracking-tight text-foreground">
            Idea Incubator
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            把模糊想法，养成能落地的样子
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/review"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            周回顾
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
            v0
          </span>
        </div>
      </div>
    </header>
  );
}
