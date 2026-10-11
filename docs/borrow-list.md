# 借用清单（GitHub 调研，2026-10-12）

> 由竞赛规划会话产出，只新增本文件、不动 src/——代码级应用做成 P19–P30 候补队列，
> 由你拍板后并入 PLAN.md 主队列（协议同：只做本条→自查→commit [Pxx]→勾选）。
> 每条都标了落点阶段；版本兼容按当前栈（Next 15 / React 19 / Drizzle / Tailwind 4 / zod）核对过。

## 一、明晚盘子直接可用（V0.2）

1. **[cmdk](https://github.com/pacocoursey/cmdk)**｜命令面板（shadcn Command 底层）｜**借到：全局 ⌘K 快速捕获**——输入三模式（关键词/文本/粘贴）统一成一个全局入口，手机上唤起也顺；比做独立输入页体面
2. **[react-hook-form](https://github.com/react-hook-form/react-hook-form) + @hookform/resolvers**｜表单状态库｜**借到：追问表单**——resolver 直接复用 `lib/expand-schema.ts` 的 zod，九字段的字段级报错不用重写
3. **[@tanstack/react-virtual](https://github.com/TanStack/virtual)**｜列表虚拟滚动｜**借到：首页/时间线**——想法多了以后列表不卡，接入点是现有 listIdeas 渲染层
4. **[Serwist](https://github.com/serwist/serwist)**｜PWA 工具链｜**借到：手机端**——next-pwa 的停更继任者，Next 15 适配良好；离线缓存策略从"只缓存壳"开始
5. **[vaul](https://github.com/emilkowalski/vaul)**｜底部抽屉（shadcn 同源）｜**借到：手机交互**——想法详情在手机上用 drawer 而不是整页跳转，手感对齐原生
6. **[vitest](https://github.com/vitest-dev/vitest)**（+ 可选 [Playwright](https://github.com/microsoft/playwright)）｜测试｜**借到：工程纪律**——scripts/selfcheck 临时脚本转正为正式单测；Playwright 把"五环走查"自动化成回归测试（P18 的走查就是脚本雏形）

## 二、V1 · AI 引擎（DeepSeek 实测阶段）

7. **[ai（Vercel AI SDK）](https://github.com/vercel/ai)**｜LLM 工具链｜**借到：expand 引擎升级**——`generateObject` 直接按 zod schema 流式产出九字段，替换 scripts/expand.ts 里的手写 JSON 容错提取；DeepSeek 有官方 provider，key 你已有
8. **[react-markdown](https://github.com/remarkjs/react-markdown) + [shiki](https://github.com/shikijs/shiki)**｜渲染｜**借到：展开结果展示**——结构化字段之外的自由文本渲染 + 代码高亮；shiki 编译期高亮无运行时开销
9. **[@mozilla/readability](https://github.com/mozilla/readability)**｜正文抽取｜**借到：网页剪裁输入**——粘贴 URL 自动抽正文再进 paste 管道，input source 枚举里预留的位置正好接上

## 三、V2 · 关联与演化（pgvector 阶段）

10. **[pgvector](https://github.com/pgvector/pgvector)**（drizzle-orm 原生 vector 类型支持）｜向量检索｜**借到：相似想法关联**——六表 schema 上加一列，embedding 用本地小模型（transformers.js CPU）或 DeepSeek 侧接口，暂不烧钱
11. **[@xyflow/react（React Flow）](https://github.com/xyflow/xyflow)**｜节点图｜**借到：想法图谱页**——相似关联+状态演化画成图，黑客松演示最出效果的一屏
12. **[Tiptap](https://github.com/ueberdosis/tiptap)**｜富文本编辑器｜**借到：idea 正文编辑（评估项）**——截图标注/富文本粘贴比 textarea 高一档，但引入成本最高，V1 后再定，别现在动

## 四、V3 · 导出与后续

13. **[docx](https://github.com/dolanmiu/docx)**｜Word 生成｜**借到：导出大创申报书/PRD**——V3 的"一页 PRD/申报书骨架"直接产出 .docx，学校模板能用
14. **[better-auth](https://github.com/better-auth/better-auth)**｜认证｜**借到：多用户（V3 后记账）**——2026 年新项目主流选择，框架无关、配置集中；V0 单用户阶段不需要，先记这一笔防到时候乱选

## 候补队列 P19–P30（≤100 字/条，并入 PLAN.md 后按协议执行）

- [ ] **P19** cmdk 全局捕获：装 cmdk，shadcn Command 包一层 ⌘K 弹层，路由内全局监听；三模式入口接到现有 create 流。自查：桌面 ⌘K 唤起、Esc 关闭、建卡走通。commit [P19]
- [ ] **P20** vitest 基建：devDeps 加 vitest，把 timeAgo/expand-schema 的 selfcheck 转成 tests/，package.json 加 test 脚本。自查：pnpm test 全绿。commit [P20]
- [ ] **P21** 追问表单重构：react-hook-form + zod resolver 接追问 UI，字段报错复用 expand-schema 格式化。自查：空提交/非法输入拦截。commit [P21]
- [ ] **P22** 列表虚拟滚动：@tanstack/react-virtual 接首页与时间线。自查：造 500 条假数据滚动不掉帧、锚点不跳。commit [P22]
- [ ] **P23** AI SDK 改造：expand 引擎换 ai SDK generateObject（DeepSeek provider），保留 CLI 双通道。自查：mock key 下 schema 校验通过。commit [P23]
- [ ] **P24** markdown 渲染：react-markdown+shiki 渲染展开自由文本。自查：XSS 转义、代码块高亮。commit [P24]
- [ ] **P25** 网页剪裁：readability 抽正文进 paste 管道，source 枚举补 clip。自查：三类网页（文章/文档/乱版）抽取对比。commit [P25]
- [ ] **P26** pgvector 迁移：drizzle 加 vector 列+索引，embedding 生成与相似查询函数。自查：插入-检索-排序用例过。commit [P26]
- [ ] **P27** 想法图谱页：@xyflow/react 读相似关系渲染图谱。自查：50 节点布局可读、点击跳详情。commit [P27]
- [ ] **P28** docx 导出：申报书/PRD 模板生成 .docx 下载路由。自查：Word/WPS 打开不乱版。commit [P28]
- [ ] **P29** serwist PWA：壳缓存+安装提示，dev 禁用 prod 启用。自查：Lighthouse PWA 项过。commit [P29]
- [ ] **P30** vaul 移动抽屉：详情页手机改 drawer。自查：375px 宽走查。commit [P30]

## 边界

- 本文件只调研不施工；P19–P30 须你确认优先级后并入 PLAN.md（P22/P25/P27 可降级或砍，其余建议保留）
- 主题已是暖纸白·墨橙（[V0.1]），所有新组件配色以 V0.1 为准
