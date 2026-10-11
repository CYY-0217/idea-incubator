"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateStatusAction } from "@/app/actions";
import { STATUS_META } from "@/components/idea-card";
import type { IdeaStatus } from "@/lib/queries";

export type BoardItem = {
  id: number;
  rawText: string;
  status: IdeaStatus;
  tags: string[];
  versionCount: number;
};

const COLUMNS: IdeaStatus[] = ["seed", "shaping", "proving", "paused", "shipped"];

export function Board({ items }: { items: BoardItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState<IdeaStatus | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  function handleDrop(status: IdeaStatus) {
    const id = dragging;
    setDragOver(null);
    setDragging(null);
    if (id == null) return;
    const item = items.find((i) => i.id === id);
    if (!item || item.status === status) return;
    startTransition(async () => {
      const res = await updateStatusAction({ id, status });
      if (res.ok) {
        toast.success(`已移到「${STATUS_META[status].label}」`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 ${
        pending ? "opacity-70" : ""
      } transition-opacity`}
    >
      {COLUMNS.map((status) => {
        const meta = STATUS_META[status];
        const columnItems = items.filter((i) => i.status === status);
        const isOver = dragOver === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((prev) => (prev === status ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(status);
            }}
            className={`flex min-h-[420px] flex-col gap-2 rounded-xl border p-2.5 transition-all duration-150 ${
              isOver
                ? "border-primary/50 bg-primary/5 shadow-card"
                : "border-border/50 bg-white/40"
            }`}
          >
            <div className="flex items-center gap-2 px-1 pt-0.5 text-xs">
              <span className={`size-1.5 rounded-full ${meta.dot}`} />
              <span className="font-medium text-foreground/80">{meta.label}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground/60">
                {columnItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(item.id));
                    e.dataTransfer.effectAllowed = "move";
                    setDragging(item.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={`cursor-grab rounded-lg border border-border/60 bg-card p-3 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover active:cursor-grabbing ${
                    dragging === item.id ? "opacity-40" : ""
                  }`}
                >
                  <Link href={`/idea/${item.id}`} className="block">
                    <p className="line-clamp-3 text-xs leading-relaxed text-foreground/90">
                      {item.rawText}
                    </p>
                    {(item.tags.length > 0 || item.versionCount > 0) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {item.versionCount > 0 && (
                          <span className="font-mono text-[10px] text-primary">
                            v{item.versionCount}
                          </span>
                        )}
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </div>
              ))}
              {columnItems.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground/50">
                  拖到这里
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
