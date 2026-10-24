# Idea Incubator · 想法孵化器

把模糊的想法——一个关键词、一段话、一段对话——随手扔进来，AI 把它展开成固定的九个字段（问题/产出形式路线/差异点/最小第一步/新颖性·可行性评分/风险），每次展开和修改都留版本节点，沉淀为想法的**演化时间线**。

定位：先做给自己用的 PC 端 web 应用；后续朝黑客松 demo 和大创选题方向演化（见 Roadmap）。

## 现状（V1.7）

已实现：

- **手动建档**：详情页直接填写九字段（可选字段留空自动补「待补」），保存即生成 v1，全程不依赖外部服务
- **⌘K 全局捕获**：任意页面唤起弹层，关键词/想法/粘贴三模式直接建卡，空输入时提供看板/图谱/周回顾快捷入口
- 收件箱：三种输入形态（关键词 / 想法 / 对话粘贴），状态筛选 + 标签筛选卡片流
- **截图/网页剪裁**：收件箱 ⌘V 直接粘贴截图（或选文件），随想法一起入库；详情页可继续补图
- **标签**：详情页增删标签，首页按标签筛选，卡片展示
- 详情页：原文、五态状态流转（种子 → 展开中 → 推进中 → 落地，搁置旁路）
- **演化时间线**：每次展开是 v_n 节点，九字段分块展示，双评分徽章，origin 标记（ZCode / DeepSeek / 手动）
- **AI 追问回流**：AI 出 3 个苏格拉底追问 → 你作答 → 回答融合成 v(n+1) 新版本（DeepSeek 自动融合，无 key 时走 ZCode 粘贴通道）
- **周回顾** `/review`：本周统计、沉睡想法提醒、相似想法配对（本地二元组 Jaccard，零 token）
- **看板** `/board`：五列拖拽看板，拖动卡片即流转状态
- **想法图谱** `/graph`：力导向关联图，连线=文本相似度（自写模拟，无依赖），拖节点、点开详情
- **AI 评审团**：四角色（产品/技术/用户/投资人）对想法各给一份裁决短评（值得做/再想想/放弃），归档在详情页
- 展开引擎：`pnpm idea:expand <id>`，DeepSeek API 与 ZCode 代跑双通道

未实现：多用户/部署/手机端 PWA、语音输入（手动转文字即可）。

## 技术栈

Next.js 15（App Router）· React 19 · TypeScript · Tailwind 4 + shadcn/ui（radix）· Drizzle ORM + PostgreSQL · zod · tsx（脚本）

## 运行手册

前置：Node 20+、pnpm、本地 PostgreSQL（macOS 推荐 `brew install postgresql@18 && brew services start postgresql@18`）。

```bash
pnpm install
cp .env.example .env        # 按需改 DATABASE_URL，默认连本机当前用户
createdb idea_incubator     # 若库不存在
pnpm exec drizzle-kit migrate   # 建表
pnpm dev                    # http://localhost:3000
```

### 展开一个想法（两种方式）

方式一：ZCode 代跑（默认，零 API token）。`DEEPSEEK_API_KEY` 未设置时：

```bash
pnpm idea:expand 12
# 脚本会打印 SYSTEM/USER 两段 prompt：
# 1. 把它们交给 ZCode 会话，让它按 SYSTEM 的规则输出 JSON
# 2. 把返回的 JSON 粘贴回脚本的标准输入（Ctrl-D 结束）
```

也支持管道（方便自动化/复现）：

```bash
printf '%s' '{"restated":"…","problem":"…","output_form":"…","alternatives":"…","edge":"…","first_step":"…","novelty":2,"feasibility":5,"risk":"…"}' | pnpm idea:expand 12
```

方式二：DeepSeek API。在 `.env` 里加一行 `DEEPSEEK_API_KEY=sk-…`，再跑同一条命令，脚本自动切换到 API 通道（model `deepseek-chat`，JSON mode）。

两种通道都会：校验九字段（类型 + 评分 1-5，评分写成字符串会自动纠偏）→ 以新版本节点写库 → 详情页时间线出现 v(n+1)。校验失败会打印字段级错误，改好重贴即可。

## 架构一屏

```
src/
  app/
    page.tsx              # 收件箱：输入区 + 状态/标签筛选 + 卡片流（实时拉库）
    idea/[id]/page.tsx    # 详情：原文、标签、状态、时间线、AI 追问、附件
    review/page.tsx       # 周回顾：统计 + 沉睡想法 + 相似配对
    board/page.tsx        # 看板：五列拖拽流转状态
    graph/page.tsx        # 图谱：力导向关联图（自写模拟，无依赖）
    actions.ts            # server actions（建卡/状态/标签/附件/追问/评审）
    api/upload            # POST 图片落盘 data/uploads/
    api/attachments/[id]  # GET 附件流（按扩展名回 content-type）
  components/             # IdeaCard、IdeaInput、StatusSwitcher、VersionTimeline、
                          # TagEditor、AttachmentPanel、FollowupPanel、Board、ForceGraph、
                          # PanelSection
  lib/
    db/                   # drizzle client 单例 + schema（6 张表，含 panel_reviews）
    queries.ts            # 查询/写入层（版本事务、周回顾、图谱、评审）
    idea-service.ts       # 输入校验（action 与脚本共用）
    expand-schema.ts      # 九字段 zod schema
    panel-schema.ts       # 评审 JSON zod schema
    prompt.ts             # 展开/追问/融合/评审团四套 prompt
    ai.ts                 # DeepSeek 通道助手（无 key 时调用方走 ZCode 路径）
    time.ts               # 相对时间
scripts/
  expand.ts               # 展开引擎 CLI（DeepSeek API / stdin 双通道）
drizzle/                  # 迁移文件
data/uploads/             # 本地附件（gitignored）
```

数据流：`想法 → ideas 表（source 标记形态）→ idea:expand 组装三分支 prompt → LLM/ZCode 返回 JSON → zod 校验 → idea_versions 新节点（v_no 事务内自增）→ 详情页时间线倒序渲染`。

## Roadmap

- **V1**：截图/网页剪裁上传（附件预览）、标签、AI 追问（追问回流为新版本节点）、周回顾 digest
- **V2**：新颖性查重（检索 GitHub/论文/产品库，引用留痕——竞品调研显示这是行业空白）、手机端 PWA、部署公网
- **V3**：大创申报书 / Lean Canvas 导出、想法关联图谱
