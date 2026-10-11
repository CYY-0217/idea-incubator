import { createIdea, type Idea, type IdeaSource } from "@/lib/queries";

export const MAX_IDEA_LENGTH = 5000;

/** 校验并落库一条想法。server action 与自查脚本共用这段逻辑。 */
export async function createIdeaSafe(input: {
  rawText: string;
  source: IdeaSource;
}): Promise<{ ok: true; idea: Idea } | { ok: false; error: string }> {
  const rawText = input.rawText.trim();
  if (!rawText) return { ok: false, error: "先写点什么再扔进来" };
  if (rawText.length > MAX_IDEA_LENGTH)
    return { ok: false, error: "太长了，先放第一段" };

  const idea = await createIdea({ rawText, source: input.source });
  return { ok: true, idea };
}
