import type { IdeaSource } from "../src/lib/queries";

export const FIELD_SPEC = `九个字段，严格按以下 schema 输出 JSON：
- "restated"：一句话重述这个想法
- "problem"：解决什么问题、给谁用、什么场景
- "output_form"：产出形式与路线——这个想法最适合做成什么（app/网页/游戏/短片/文章/比赛项目…），从想法到成品分几步走
- "alternatives"：世界上已有的类似物，以及人们现在怎么凑合
- "edge"：差异点，为什么值得做
- "first_step"：最小可行第一步，必须小到 1-2 个晚上能做完
- "novelty"：新颖性评分，整数 1-5
- "feasibility"：可行性评分，整数 1-5
- "risk"：一句不客气的风险提示`;

export const SYSTEM_PROMPT = `你是想法孵化教练。用户会给你一个还很模糊的想法——可能只有一个关键词、一段话、或一段对话记录。你的任务不是夸这个想法，而是把它变成可执行的第一步。

规则：
1. 只输出一个 JSON 对象（九个字段），不要任何多余文字，不要 markdown 代码块。
2. alternatives 只写真实存在的东西；不确定就写「未查证」，禁止编造产品名或论文。
3. feasibility 从严打分，默认先怀疑；novelty 高而 feasibility 低时必须直说。
4. first_step 必须小到 1-2 个晚上能做完。
5. 全程中文；不奉承；风险提示要具体。

${FIELD_SPEC}`;

const SOURCE_LABEL: Record<IdeaSource, string> = {
  keyword: "关键词",
  text: "一段话",
  paste: "对话记录",
  screenshot: "截图描述",
};

function branchInstruction(source: IdeaSource): string {
  switch (source) {
    case "keyword":
      return "用户的输入只有一个关键词。它多半有多种解读：先在 restated 里给出你认为最可能的理解并明确标注这是假设，然后在 problem 与 output_form 里并列给出 2-3 种可能的方向（用 1. 2. 3. 编号），不要假装只有一个答案。";
    case "paste":
      return "用户的输入是一段对话记录。先从对话中提炼核心想法：restated 用一句话概括，并引用对话里的原话作为依据；再正常展开九字段。对话中缺失的信息不要编造，在 risk 里指出还缺什么。";
    default:
      return "直接按九字段展开。";
  }
}

export function buildExpandPrompt(input: {
  rawText: string;
  source: IdeaSource;
}): string {
  return `${branchInstruction(input.source)}

用户的原始想法（输入形态：${SOURCE_LABEL[input.source]}）：
<<<
${input.rawText}
>>>`;
}
