"use server";

import { revalidatePath } from "next/cache";

import { callDeepSeekJSON, extractJson, hasDeepSeekKey } from "@/lib/ai";
import { createIdeaSafe } from "@/lib/idea-service";
import {
  expandPayloadSchema,
  formatExpandError,
} from "@/lib/expand-schema";
import { panelPayloadSchema, formatPanelError } from "@/lib/panel-schema";
import {
  addAttachment,
  addFollowup,
  addIdeaVersion,
  addPanelReview,
  getIdea,
  setTags,
  updateStatus,
  type IdeaStatus,
  type IdeaSource,
} from "@/lib/queries";
import {
  buildExpandPrompt,
  buildMergePrompt,
  buildPanelPrompt,
  buildQuestionPrompt,
  MERGE_SYSTEM,
  PANEL_SYSTEM,
  QUESTION_SYSTEM,
} from "@/lib/prompt";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createIdeaAction(input: {
  rawText: string;
  source: IdeaSource;
  attachmentPaths?: string[];
}): Promise<ActionResult> {
  const res = await createIdeaSafe(input);
  if (!res.ok) return res;
  for (const p of input.attachmentPaths ?? []) {
    await addAttachment({ ideaId: res.idea.id, filePath: p });
  }
  revalidatePath("/");
  return { ok: true };
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

export async function setTagsAction(input: {
  ideaId: number;
  names: string[];
}): Promise<ActionResult> {
  await setTags(input.ideaId, input.names);
  revalidatePath("/");
  revalidatePath(`/idea/${input.ideaId}`);
  return { ok: true };
}

export async function addAttachmentAction(input: {
  ideaId: number;
  filePath: string;
}): Promise<ActionResult> {
  await addAttachment({ ideaId: input.ideaId, filePath: input.filePath });
  revalidatePath(`/idea/${input.ideaId}`);
  return { ok: true };
}

/* ---------- AI 追问（双通道：DeepSeek 自动 / ZCode 代跑） ---------- */

export type FollowupResult =
  | { ok: true; mode: "deepseek"; questions: string[] }
  | { ok: true; mode: "zcode"; prompt: string }
  | { ok: false; error: string };

export async function generateFollowupsAction(input: {
  ideaId: number;
}): Promise<FollowupResult> {
  const detail = await getIdea(input.ideaId);
  if (!detail) return { ok: false, error: "想法不存在" };
  const payload = (detail.versions[0]?.payload ?? {}) as Record<string, unknown>;
  const existing = detail.followups.map((f) => f.question);

  if (hasDeepSeekKey()) {
    try {
      const parsed = (await callDeepSeekJSON(
        QUESTION_SYSTEM,
        buildQuestionPrompt(payload, existing),
      )) as { questions?: unknown };
      const raw = Array.isArray(parsed.questions) ? parsed.questions : [];
      const questions = raw.map(String).filter(Boolean);
      if (questions.length === 0) return { ok: false, error: "AI 没返回问题" };
      return { ok: true, mode: "deepseek", questions };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  // ZCode 通道：把 prompt 交给 UI，用户复制给 ZCode，再把 JSON 粘回来
  return {
    ok: true,
    mode: "zcode",
    prompt: `=== SYSTEM ===\n${QUESTION_SYSTEM}\n\n=== USER ===\n${buildQuestionPrompt(payload, existing)}`,
  };
}

export type MergeResult =
  | { ok: true; mode: "deepseek"; saved: number }
  | { ok: true; mode: "zcode"; prompt: string }
  | { ok: false; error: string };

/** 保存追问回答；有 key 时直接让 AI 融合成新版本，无 key 返回融合 prompt */
export async function submitFollowupsAction(input: {
  ideaId: number;
  qas: Array<{ question: string; answer: string }>;
  refine: boolean;
}): Promise<MergeResult> {
  const qas = input.qas.filter((q) => q.answer.trim());
  if (qas.length === 0) return { ok: false, error: "至少回答一个问题" };

  const detail = await getIdea(input.ideaId);
  if (!detail) return { ok: false, error: "想法不存在" };

  for (const qa of qas) {
    await addFollowup({
      ideaId: input.ideaId,
      question: qa.question,
      answer: qa.answer.trim(),
    });
  }
  revalidatePath(`/idea/${input.ideaId}`);

  if (!input.refine) return { ok: true, mode: "deepseek", saved: qas.length };

  const payload = (detail.versions[0]?.payload ?? {}) as Record<string, unknown>;

  if (hasDeepSeekKey()) {
    try {
      const merged = await callDeepSeekJSON(
        MERGE_SYSTEM,
        buildMergePrompt(payload, qas),
      );
      const result = expandPayloadSchema.safeParse(merged);
      if (!result.success)
        return { ok: false, error: formatExpandError(result.error) };
      const v = await addIdeaVersion({
        ideaId: input.ideaId,
        payload: result.data,
        origin: "deepseek",
      });
      revalidatePath(`/idea/${input.ideaId}`);
      return { ok: true, mode: "deepseek", saved: v.vNo };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  return {
    ok: true,
    mode: "zcode",
    prompt: `=== SYSTEM ===\n${MERGE_SYSTEM}\n\n=== USER ===\n${buildMergePrompt(payload, qas)}`,
  };
}

/** ZCode 通道：用户把融合后的九字段 JSON 粘回来，校验后写为新版本 */
export async function applyMergedVersionAction(input: {
  ideaId: number;
  json: string;
}): Promise<ActionResult & { vNo?: number }> {
  let parsed: unknown;
  try {
    parsed = extractJson(input.json);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const result = expandPayloadSchema.safeParse(parsed);
  if (!result.success)
    return { ok: false, error: formatExpandError(result.error) };

  const v = await addIdeaVersion({
    ideaId: input.ideaId,
    payload: result.data,
    origin: "zcode",
  });
  revalidatePath(`/idea/${input.ideaId}`);
  return { ok: true, vNo: v.vNo };
}

export async function saveManualVersionAction(input: {
  ideaId: number;
  payload: Record<string, unknown>;
}): Promise<ActionResult & { vNo?: number }> {
  const result = expandPayloadSchema.safeParse(input.payload);
  if (!result.success)
    return { ok: false, error: formatExpandError(result.error) };

  const v = await addIdeaVersion({
    ideaId: input.ideaId,
    payload: result.data,
    origin: "manual",
  });
  revalidatePath(`/idea/${input.ideaId}`);
  return { ok: true, vNo: v.vNo };
}

/* ---------- AI 评审团（双通道） ---------- */

export type PanelResult =
  | { ok: true; mode: "deepseek" }
  | { ok: true; mode: "zcode"; prompt: string }
  | { ok: false; error: string };

export async function generatePanelAction(input: {
  ideaId: number;
}): Promise<PanelResult> {
  const detail = await getIdea(input.ideaId);
  if (!detail) return { ok: false, error: "想法不存在" };
  const payload = (detail.versions[0]?.payload ?? { rawText: detail.idea.rawText }) as Record<string, unknown>;

  if (hasDeepSeekKey()) {
    try {
      const parsed = await callDeepSeekJSON(
        PANEL_SYSTEM,
        buildPanelPrompt(payload),
      );
      const result = panelPayloadSchema.safeParse(parsed);
      if (!result.success)
        return { ok: false, error: formatPanelError(result.error) };
      await addPanelReview({
        ideaId: input.ideaId,
        payload: result.data,
        origin: "deepseek",
      });
      revalidatePath(`/idea/${input.ideaId}`);
      return { ok: true, mode: "deepseek" };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  return {
    ok: true,
    mode: "zcode",
    prompt: `=== SYSTEM ===\n${PANEL_SYSTEM}\n\n=== USER ===\n${buildPanelPrompt(payload)}`,
  };
}

export async function applyPanelAction(input: {
  ideaId: number;
  json: string;
}): Promise<ActionResult> {
  let parsed: unknown;
  try {
    parsed = extractJson(input.json);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const result = panelPayloadSchema.safeParse(parsed);
  if (!result.success)
    return { ok: false, error: formatPanelError(result.error) };

  await addPanelReview({
    ideaId: input.ideaId,
    payload: result.data,
    origin: "zcode",
  });
  revalidatePath(`/idea/${input.ideaId}`);
  return { ok: true };
}
