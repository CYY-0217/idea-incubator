"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateStatusAction } from "@/app/actions";
import { STATUS_META } from "@/components/idea-card";
import type { IdeaStatus } from "@/lib/queries";

export function StatusSwitcher({
  id,
  current,
}: {
  id: number;
  current: IdeaStatus;
}) {
  const [pending, startTransition] = useTransition();
  const statuses = Object.keys(STATUS_META) as IdeaStatus[];

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="状态切换"
    >
      {statuses.map((s) => {
        const meta = STATUS_META[s];
        const active = s === current;
        return (
          <button
            key={s}
            disabled={pending || active}
            onClick={() =>
              startTransition(async () => {
                const res = await updateStatusAction({ id, status: s });
                if (res.ok) toast.success(`状态改为「${meta.label}」`);
                else toast.error(res.error);
              })
            }
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-all duration-150 active:scale-95 disabled:opacity-90 ${
              active
                ? "border-border bg-secondary text-foreground shadow-sm"
                : "border-border/70 text-muted-foreground hover:-translate-y-px hover:bg-card hover:text-foreground hover:shadow-sm"
            }`}
          >
            <span className={`size-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
