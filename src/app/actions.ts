"use server";

import { revalidatePath } from "next/cache";

import { createIdeaSafe } from "@/lib/idea-service";
import { updateStatus, type IdeaStatus, type IdeaSource } from "@/lib/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createIdeaAction(input: {
  rawText: string;
  source: IdeaSource;
}): Promise<ActionResult> {
  const res = await createIdeaSafe(input);
  if (res.ok) revalidatePath("/");
  return res;
}

export async function updateStatusAction(input: {
  id: number;
  status: IdeaStatus;
}): Promise<ActionResult> {
  const row = await updateStatus(input.id, input.status);
  if (!row) return { ok: false, error: "想法不存在" };
  revalidatePath("/");
  revalidatePath(`/idea/${input.id}`);
  return { ok: true };
}
