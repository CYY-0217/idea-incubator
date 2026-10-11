"use server";

import { revalidatePath } from "next/cache";

import { createIdeaSafe } from "@/lib/idea-service";
import type { IdeaSource } from "@/lib/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createIdeaAction(input: {
  rawText: string;
  source: IdeaSource;
}): Promise<ActionResult> {
  const res = await createIdeaSafe(input);
  if (res.ok) revalidatePath("/");
  return res;
}
