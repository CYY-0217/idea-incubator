import { Board, type BoardItem } from "@/components/board";
import {
  listIdeas,
  tagsForIdeas,
  versionCountsForIdeas,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const ideas = await listIdeas();
  const tagMap = await tagsForIdeas(ideas.map((i) => i.id));
  const versionMap = await versionCountsForIdeas(ideas.map((i) => i.id));

  const items: BoardItem[] = ideas.map((i) => ({
    id: i.id,
    rawText: i.rawText,
    status: i.status,
    tags: tagMap.get(i.id) ?? [],
    versionCount: versionMap.get(i.id) ?? 0,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="page-title">看板</h1>
        <p className="page-sub">
          拖动卡片流转状态。从种子到落地，一个想法的流水线。
        </p>
      </div>
      {items.length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">
          还没有想法。先回收件箱扔一条进来。
        </p>
      ) : (
        <Board items={items} />
      )}
    </div>
  );
}
