export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          把模糊想法，养成能落地的样子。
        </p>
        <p className="font-mono text-[11px] text-muted-foreground/60">
          <a
            href="https://github.com/CYY-0217/idea-incubator"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          {" · "}
          v0.1
        </p>
      </div>
    </footer>
  );
}
