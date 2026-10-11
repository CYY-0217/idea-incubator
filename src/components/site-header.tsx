export function SiteHeader() {
  return (
    <header className="border-b border-border/70">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm tracking-tight text-foreground">
            Idea Incubator
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            把模糊想法，养成能落地的样子
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
          v0
        </span>
      </div>
    </header>
  );
}
