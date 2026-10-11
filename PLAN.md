# Idea Incubator — 无人值守开发计划

最后更新：2026-10-11 深夜。执行者：ZCode（用户已离线，明早验收）。

## 一句话

个人用的想法孵化器：把一个关键词、一段话、或一段粘贴的对话随手扔进来，AI 展开成固定九字段（先由 ZCode 代跑，后接 DeepSeek），每次展开/修改留版本节点，沉淀为演化时间线。

## 本轮边界（V0）

- PC 网页端，本地跑。不做：登录/多用户/部署/手机/PWA/语音/OCR/截图上传（截图在明晚盘子）。
- 不灌任何 seed 数据，库里从零开始。
- AI 引擎：`scripts/expand.ts` 有 `DEEPSEEK_API_KEY` 走 API（openai 兼容端点），无 key 打印 prompt 等 stdin（必须支持管道喂入）。本轮不消耗用户 API token。
- UI：shadcn/ui，暗色基调。
- 技术栈对齐 fullstack-learning/01-saas-starter：Next 15 + React 19 + Drizzle + postgres.js + Tailwind 4 + zod。
- 数据库：本地 Postgres（brew），库名 `idea_incubator`。

## 数据模型（5 表）

- `ideas`：id, user_id(预留), raw_text, source(`keyword|text|paste|screenshot(预留)`), status(`seed|shaping|proving|paused|shipped` pgEnum), created_at, updated_at
- `idea_versions`：id, idea_id, v_no, payload(jsonb), origin(`zcode|deepseek|manual`), created_at
- `attachments`：id, idea_id, file_path, kind, created_at —— 今晚只建表
- `followups`：id, idea_id, question, answer, created_at —— 今晚只建表
- `tags`：id, name ／ `idea_tags`：idea_id, tag_id —— 今晚只建表

## 展开九字段（payload，zod 校验）

`restated`（一句话重述）/ `problem`（问题·用户·场景）/ `output_form`（产出形式与路线）/ `alternatives`（现有类似物）/ `edge`（差异点）/ `first_step`（1-2 晚能完成的最小第一步）/ `novelty`（1-5）/ `feasibility`（1-5，从严）/ `risk`（一句不客气的风险提示）

规则：只输出 JSON；alternatives 必须真实存在、不确定标「未查证」；first_step 必须小；不许奉承；全中文。

## prompt 三分支（scripts/prompt.ts）

- `keyword`：给 2-3 种可能解读，restated 里标注假设
- `paste`：先从对话提炼核心想法（引用原话），再展开
- `text`：直接展开

## 无人值守执行协议（每条任务必守）

1. 只做本条范围，不重构超范围，不装计划外新依赖。
2. 完成即自查：命令类用 `tsc --noEmit` / `psql` / `tsx` 脚本 / 管道；页面类用浏览器工具走查（截图核对）。
3. 自查全过 → `git commit`（信息前缀 `[Pxx]`）→ 本文件勾选对应项。
4. 自查失败 → 修复重试 ≤2 次 → 仍败则回滚本步改动、在下方 BLOCK 区记录原因、停止等人工。
5. 任何时刻仓库可运行（dev 不被破坏）；全程不提问，按本计划默认值决策。

## 任务清单（勾选 = 完成且自查通过）

- [x] P01 初始化：Next.js 项目（TS/App Router/Tailwind4/src+@别名）+ git + 依赖（drizzle-orm/postgres/zod/drizzle-kit）。自查 tsc+dev。
- [x] P02 UI 基建：shadcn init 暗色 + 8 组件（button/card/input/textarea/badge/select/dialog/sonner）+ layout 页头。自查 tsc。
      备注：shadcn 4.x 用 `init -b radix -p nova`（预设 Nova=Lucide+Geist）；主题改暖黑+琥珀（oklch 0.8 0.128 78）；next/font 变量挂 html 修中文宋体问题；截图自查通过。
- [x] P03 数据库基建：.env/.env.example、createdb idea_incubator、drizzle.config.ts、空迁移跑通。自查 psql 连通。
      备注：PostgreSQL 18.6（brew，用户 cyy，socket /tmp:5432）；.gitignore 补 `!.env.example` 豁免。
- [x] P04 schema 五表 + 枚举 + 索引，generate+migrate。自查 psql \dt 五表。
- [x] P05 lib/db 单例 + queries 组一：createIdea/listIdeas/getIdea(联表)/updateStatus。自查 tsx 建→查。
- [x] P06 queries 组二：addIdeaVersion(事务 v_no+1)/addFollowup/addAttachment/setTags。自查 tsx v_no=1。
- [x] P07 lib/time.ts 相对时间工具。自查 tsx 三例。
- [x] P08 IdeaCard 卡片组件（类型徽章/五态色条/截断/相对时间）。自查 tsc+假数据。
- [x] P09 首页卡片流 + 状态筛选 chips（?status= 驱动）。自查浏览器走查。
      备注：Playwright 点击自动化超时（IAB 环境问题），筛选改用 URL 直达 + DOM 快照验证，功能正常。
- [x] P10 输入区：三模式 chips + textarea + server action + 空状态 + sonner。自查两模式各建一条。
      备注：IAB 后端不派发物理点击/按键（事件探针证实），交互自查改用 DOM 级 .click() 驱动（真实 DOM 事件、React 完整处理）；校验逻辑抽到 lib/idea-service.ts 便于脚本测试。
- [ ] P11 详情页 /idea/[id]：原文+元信息+附件占位，notFound。自查 404。
- [ ] P12 版本时间线组件（九字段分块+双分徽章）。自查假数据走查。
- [ ] P13 状态切换按钮组 + server action。自查改状态→列表筛选生效。
- [ ] P14 scripts/prompt.ts：system prompt + 三分支 + 九字段说明。自查 tsx 打印三分支。
- [ ] P15 lib/expand-schema.ts：zod 九字段校验。自查 tsx 合法/非法样例。
- [ ] P16 scripts/expand.ts：API/stdin 双通道 + idea:expand 脚本。自查管道喂合法+非法 JSON。
- [ ] P17 README：简介/运行手册/架构/V2-V3 roadmap。
- [ ] P18 终验：tsc+build 全绿，浏览器全流程走查，push GitHub + tag v0.1。

## BLOCK 记录

（自查 2 次仍失败时，在此记录任务号+原因）

## 明晚盘子

截图上传 /api/upload、标签 UI、追问（表单+AI 自动出题+回流新版本）、周回顾 /review、PWA/手机端、Magic UI 动效、DeepSeek 实测、黑客松演示脚本。
