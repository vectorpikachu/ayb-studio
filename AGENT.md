# AGENT.md — Ayb 工作手册

> 任何 AI agent 在这个仓库动手之前，先读这份文件，再读 [`memory/`](memory/README.md)。
> 最后更新：2026-10-21 · 对应提交：见 git log。

## 0. 一句话

Ayb 是一个安静、可注册、按用户保存进度的亚美尼亚语学习网站：词典、间隔复习、15 节语法课、文学课文、文化地图与私人写作室。视觉是 Apple Liquid Glass 启发下的暖色纸感界面，不是通用 SaaS 模板。

## 1. 用户的硬性准则

这些不是建议，是这段协作里被反复纠正后确认的底线。

### 1.1 只做网站

- **不要**重新引入 Docker、Docker Compose、Electron、桌面安装包、`.exe`、desktop CI。
- 部署方式就是 `npm run build && npm start`，前面可以放 Nginx / Caddy。
- 不要为了“方便部署”把项目改成静态导出：登录、进度、写作、管理员都需要服务端 API 和本地 JSON 数据库。
- 用户明确说过：“我现在不想装这个 docker，能不能不用 docker，我就不要这个 exe 之类的了，单纯是一个网站。”

### 1.2 亚美尼亚语手写体必须是真连笔

- 页头的品牌字、字母表、单词/例句旁的手写对照、课文手写模式，使用 **Poqrik dzeragir** 的连笔手写，不用“手写风格的印刷体”。
- 用户否定过两类字体：
  1. Tumanian 风格太狂放；
  2. First Time Writing 只是“手写体风格的印刷体”，不能作为亚美尼亚语手写主体。
- First Time Writing 只用于拉丁注释/英文小字，不能替代 Poqrik。
- 手写不能只出现在标题上：单词、例句、课文、字母卡都要有印刷体 + 手写体的并置。
- 字母卡必须同时显示**大写和小写**手写；只显示小写会被指出。

### 1.3 数字不要混进亚美尼亚手写

- Poqrik **没有 0–9 字形**。
- 不要把手写串里的数字交给 First Time Writing（拉丁手写数字）——和亚美尼亚连笔放一起很难看。
- 数字应回退到 **Noto Sans Armenian 印刷体**；在文化标题里通过 `HandText` 再把数字缩到 `0.78em`，避免 `1915` 比旁边的 `թվական` 大一圈。
- 相关实现：`src/app/globals.css` 的 `@font-face unicode-range`、`src/components/hand-text.tsx`。

### 1.4 语法：七个格，不是十二个

- 现代亚美尼亚语标准语法是 **7 个格**：主格、宾格、属格、与格、夺格、工具格、位格。
- 用户问过“不是有十二种格吗？”——正确回应是解释常见混淆（12 年级教材、变格类型、格与数的组合），并说明也有 6 格分析，但 **12 格不是通行分析**。
- 不要为了迎合而把课程改成 12 格。
- 语法顺序必须是：A1 基础 → A2 时间 → **B1 七个格 + 变格/复数** → B2 关系从句/条件/被动使役/转述。
- B1 目前是 3 节连续的格系统课；B2 从第 12 课开始。

### 1.5 内容不能是“占位式”的

- 用户问过“为什么就一篇课文？”，后来又问“后面两篇课文为什么就这么一点点？”。
- 文学课文不能只放一句名言或两行诗充数。至少要有：
  - 真实、可核对的原文（公共领域优先）；
  - 作者/作品/年份/来源；
  - 中文翻译；
  - 生词表；
  - 语法点；
  - 古旧文本的现代亚美尼亚语改写；
  - 足够的篇幅（当前阿博维扬 5 段 / 126 词，恰连茨全诗 4 节 / 127 词）。
- 诗歌要保留原始换行：阅读器对 `hy` / `zh` 使用 `whitespace-pre-line`。
- 不要编造原文、作者或年份；不确定就标“待核”或不用。

### 1.5.1 扩展词与精编词同层

- `src/data/lexicon` 存 1,297 个常用词的源数据；`getContentWords()` 会把它们转成使用可读转写 id 的词条（与精编词同一种编号风格），与精编词一起进入词典、分类和复习队列。
- UI 里不要再写 EXT、扩展词库、来源说明或“不进入复习”之类的区分；用户要求完全融入原有集合。
- 扩展词的中/英/俄释义与例句是模型生成的，建议发布前请母语者复核；这条只写在工程文档里，不要显示在页面。
- 词头与例句的 translit 由 `src/lib/practical-translit.ts` 统一重算（实用转写，无撇号/变音符号）；源数据里的学术转写不要直接展示，id 保持不变。
- 音频与词频的来源、重生成命令见 `memory/engineering-and-qa.md`。

### 1.6 管理员必须能增删改

- 词条、语法课、课文、文化条目都要有管理员写入口。
- `/admin`：词条/语法 JSON 上传、覆盖、删除。
- `/admin/library`：课文/文化 JSON 编辑器，可新建、修改、删除、下载。
- 数据模型是 **静态种子 + 数据库自定义覆盖**：相同 `id` 覆盖内置内容；删除覆盖恢复内置。
- 课文/文化详情页必须保持动态（不要加 `generateStaticParams`），否则管理员覆盖不会立即生效。
- 管理员接口必须检查 `role === "admin"`；页面未登录跳登录，非管理员 404。

### 1.7 视觉与品牌

- 视觉语言：暖纸色、石榴红/杏色、Liquid Glass 磨砂面板、细内描边、克制动效。
- 中文字体回退到 PingFang SC / Microsoft YaHei；正文用 Noto Sans；亚美尼亚语印刷体用 Noto Sans Armenian。
- Logo 标记、favicon、PWA 图标、Apple Touch Icon 必须使用亚美尼亚字母 **Ա (Ayb)**，不能是拉丁 A。
- 页头品牌标记与 favicon 要是同一个字形。
- 不要使用通用的紫色渐变 SaaS 模板、过亮霓虹、夸张弹跳动画。

### 1.8 响应式是硬要求

- 桌面导航在 `lg` 才展开；`lg` 以下用移动端底部 Dock。
- 当前导航 7 项（首页 + 词典/复习/语法/课文/文化/写作），Dock 也是 7 项。
- 至少检查 **390 / 768 / 1024 / 1440** 四个宽度；确保没有横向滚动、导航不压住 logo/按钮。
- 曾经在 768px 出现 6 项导航与右侧按钮重叠；修法是 `lg` 断点 + 缩小 Dock 项的最小宽度。
- 阅读/文化索引的说明面板在 `lg` 以下隐藏，只保留一行提示；否则正文会被推到两屏之外。
- 长阅读标题用 `titleLines` + `sm:hidden` 的 `<br>` 断行，避免最后一个字孤行。
- 阅读/文化页移动端底部留 `pb-28`，避免固定 Dock 盖住最后一段。

### 1.9 敏感内容

- 1915 相关内容要事实、克制、可核对；不要用宣传式语言，也不要用否认式语言。
- 文化栏目是编辑性内容，正式发布前建议请亚美尼亚语母语者/历史方向的人复核。
- 文学翻译是意译，要标明“建议母语者复核”。

## 2. 技术栈与目录

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS 4 + 自定义 CSS 变量
- Motion 用于克制动效
- 本地 JSON 数据库（无外部数据库）
- 自托管字体（`public/fonts/`）
- Playwright Core + 本机 Edge 做 E2E

关键目录：

```text
src/app/                 # 页面与 API
src/components/          # UI、阅读器、管理员、手写组件
src/data/
  dictionary/            # 136 个精编词条
  lexicon/               # 1,297 个带中/俄释义与例句的词
  bulk/                  # 12,486 个英文释义词条
  grammar/               # 15 节课
  reading/               # 3 篇课文
  culture/               # 11 个文化条目
src/lib/server/          # JSON DB、auth、content merge、admin
public/fonts/            # Poqrik / Noto / First Time Writing
memory/                  # 经验与用户偏好
```

关键文件：

| 文件 | 作用 |
| --- | --- |
| `src/lib/server/content.ts` | 静态种子 + 自定义内容的合并读取 |
| `src/lib/server/admin-content.ts` | 管理员快照与保存/删除 |
| `src/lib/server/admin-validation.ts` | 词条/课程/课文/文化的 zod schema |
| `src/app/admin/library/page.tsx` | 课文与文化编辑器入口 |
| `src/components/admin/library-studio.tsx` | JSON 编辑器 UI |
| `src/components/hand-text.tsx` | 手写文本中的数字转印刷体 |
| `src/app/globals.css` | 字体、玻璃、设计变量 |
| `src/components/brand.tsx` | 页头品牌 `Ա` |
| `src/app/reading/[slug]/page.tsx` | 课文详情（动态，支持覆盖） |
| `src/app/culture/[slug]/page.tsx` | 文化条目详情（动态，支持覆盖） |

## 3. 数据流

1. `src/data/*` 是种子内容，提交进仓库。
2. 管理员编辑/上传写入 `.data/ayb.db.json` 的 `custom*` 数组。
3. `getContent*` 用 `mergeById(base, custom)` 合并；同 id 自定义覆盖内置。
4. 删除自定义记录 = 恢复内置内容。
5. 管理员 API 返回完整 snapshot（包含 merged 数组），前端立即更新。
6. `revalidatePath("/", "layout")` 在写操作后刷新页面缓存。

新增内容类型时，照这个模式做，不要另起一套。

## 4. 常用命令

```powershell
npm run dev
npm run typecheck
npm run build
npm run qa
```

生产预览（PowerShell）：

```powershell
$env:NODE_ENV="production"
$env:AYB_ENABLE_DEMO="true"
$env:AYB_DATA_DIR="C:\Users\lvhan\Desktop\test\Armenian\qa-output\web-data-current"
$env:NEXT_PUBLIC_SITE_URL="http://localhost:3000"
npm start
```

E2E 需要先启动生产服务器：

```powershell
$env:AYB_BASE_URL="http://localhost:3000"
npm run qa
```

## 5. 修改流程

1. 读 `AGENT.md` 和 `memory/` 相关文件。
2. `git status`，确认当前工作树和正在运行的服务。
3. 做最小、完整的修改；不要顺手重做整个页面。
4. 涉及内容数量时，同步更新 `README.md` 的统计、截图和文案。
5. 运行 `npm run typecheck`。
6. 停掉正在运行的 `next start` / `next dev`，再 `npm run build`。
7. 用**生产模式**跑 `npm run qa`；不要只测 dev。
8. 涉及 UI 的修改，截 1440 与 390 的图；必要时看 768 / 1024。
9. `git diff --check`，然后提交。
10. 如果出现了新的“用户偏好/踩坑”，更新 `memory/`。

## 6. 常见坑

- **Windows `ReplaceFileW EIO (Win32 1175)`**：编辑文件时偶发，重试同一操作即可；不要改成粗暴覆盖。
- **先停服务再 build**：`next start` 与 `next build` 同时使用 `.next` 会出问题。
- **不要给管理员可编辑的详情页加 `generateStaticParams`**：会静态化，覆盖不生效。
- **`next/font` 的 Latin fallback**：曾导致拉丁字符在亚美尼亚手写串里渲染成 Noto Sans；最终改成手工 `@font-face` + `unicode-range`。
- **Poqrik 不含数字**：不要把数字塞进 Poqrik 的 unicode-range；也不要用 First Time Writing 的数字。
- **favicon 缓存**：替换图标后浏览器可能继续显示旧图；硬刷新/重开标签页。
- **E2E 管理员删除偶发失败**：等待时间已调到 1500ms；若再遇到，先确认是不是残留自定义数据。
- **React #418 偶发**：只出现过一次，重跑消失；若持续出现，检查无效 HTML 嵌套或首屏状态不一致。
- **诗歌换行**：`zh` / `hy` 用 `whitespace-pre-line`，否则诗意会被折成一整段。
- **数量统计**：README、页面文案、测试断言里的数字容易漂移；改内容后全局搜索旧数字。
- **不要删内置内容**：管理员只能覆盖/恢复，不能删除种子；这是产品语义。

## 7. 完成定义

一个改动算完成，至少满足：

- [ ] `npm run typecheck` 通过
- [ ] `npm run build` 通过
- [ ] 生产模式 `npm run qa` 通过
- [ ] 桌面 1440 与移动 390 视觉检查通过（UI 改动）
- [ ] 没有横向滚动/导航重叠
- [ ] README 统计、截图、文案同步（内容改动）
- [ ] `git status` 干净，提交信息清楚
- [ ] 新的持久经验已写入 `memory/`

## 8. Memory 索引

- [`memory/README.md`](memory/README.md) — 记忆目录说明
- [`memory/user-principles.md`](memory/user-principles.md) — 用户准则与偏好
- [`memory/content-and-typography.md`](memory/content-and-typography.md) — 内容、字体、数字、品牌
- [`memory/engineering-and-qa.md`](memory/engineering-and-qa.md) — 架构、数据流、测试、坑
- [`memory/session-retrospective.md`](memory/session-retrospective.md) — 这段开发过程的复盘
