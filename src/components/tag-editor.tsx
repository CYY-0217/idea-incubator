"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setTagsAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function TagEditor({
  ideaId,
  initial,
}: {
  ideaId: number;
  initial: string[];
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function save(next: string[]) {
    setTags(next);
    startTransition(async () => {
      const res = await setTagsAction({ ideaId, names: next });
      if (!res.ok) toast.error(res.error);
    });
  }

  function add() {
    const name = draft.trim();
    if (!name) return;
    if (tags.includes(name)) {
      setDraft("");
      return;
    }
    save([...tags, name]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <Badge
          key={t}
          variant="secondary"
          className="gap-1 rounded-md pr-1 font-normal"
        >
          {t}
          <button
            type="button"
            aria-label={`移除标签 ${t}`}
            disabled={pending}
            onClick={() => save(tags.filter((x) => x !== t))}
            className="rounded-sm p-0.5 transition-colors hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <div className="flex items-center gap-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="加标签"
          className="h-7 w-24 rounded-md border-dashed bg-transparent px-2 text-xs"
        />
        <button
          type="button"
          aria-label="添加标签"
          disabled={pending || !draft.trim()}
          onClick={add}
          className="rounded-md border border-border/70 p-1 text-muted-foreground transition-all duration-150 hover:bg-card hover:text-foreground active:scale-90 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
