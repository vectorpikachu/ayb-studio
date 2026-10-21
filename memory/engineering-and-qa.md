# 工程与 QA

## 1. 架构

```text
Next.js 15 App Router
  ├─ 页面（Server Components）
  ├─ 客户端组件（交互）
  ├─ Route Handlers（/api）
  └─ 本地 SQLite（.data/ayb.sqlite）
```

没有外部数据库、没有 ORM、没有 Docker。数据库是单个 SQLite 文件，通过 Node 内置的 `node:sqlite`（`DatabaseSync`）访问，初始化与业务读写在 `src/lib/server/db.ts`。要求 Node ≥ 22.13；Node 22 首次打开数据库会打印一次 `ExperimentalWarning`，属预期。

连接初始化设置：`journal_mode = WAL`、`foreign_keys = ON`、`busy_timeout = 5000`、`synchronous = NORMAL`。所有写入用 `BEGIN IMMEDIATE` + 同步回调；密码哈希、读取旧 JSON 等异步工作必须在事务外完成。schema 版本由 `PRAGMA user_version = 1` 标识，播种/迁移完成由 `app_meta.initialized = 1` 标识。

### 表结构

- 用户数据：`users`、`sessions`、`review_states`、`grammar_progress`、`writings`、`activities`；会话/写作/活动对 `users` 使用 `ON DELETE CASCADE`。
- 词库：`words`（TS 种子同步结果，`sort_order` 决定词典顺序）与 `word_overrides`（管理员覆盖）。有效词 = 种子 `LEFT JOIN` 覆盖 + 仅存在于覆盖表的词。
- 可编辑内容：`custom_lessons`、`custom_reading_texts`、`custom_culture_entries`，每行 `id + payload_json + updated_at`。
- 元数据：`app_meta` 保存 `initialized`、`words_seed_hash` 等。
- `review_states.interval_days` 是 `REAL`：10 分钟 = `0.00694` 天，0.25 天也是合法值；不要改成 INTEGER。
- `review_states.word_id` **不加外键**：它可能指向仅存在于 `word_overrides` 的词，也不能因种子变动级联删除学习记录。
- 活动超过 20,000 条时保留最近 10,000 条，统一走 `trimActivities` / `insertActivityRecord`。

### 首次初始化与迁移

1. 新数据库：调用 `buildSeedSnapshot()`；只有 `AYB_ENABLE_DEMO=true`（或非生产默认开启）时才播种演示用户与进度。
2. 旧数据库：若 `.data/ayb.db.json` 存在，解析并一次性导入 `users` / 会话 / 复习 / 语法 / 写作 / 活动 / `customWords` / `customLessons` / `customReadingTexts` / `customCultureEntries`。原 JSON 保留为备份，之后不再读取。
3. 数据与 `initialized` 标记在同一个事务里写入。
4. 每次启动独立执行词种子同步：`word-seed.ts` 转换三份 TS 词表，计算内容哈希；哈希变化时在事务中重建 `words`，**不动** `word_overrides`。
5. `NEXT_PHASE === "phase-production-build"` 时初始化会主动抛错，防止 `next build` 提前创建数据库。

### 认证

- HttpOnly cookie `ayb_session`，30 天。
- 管理员：`role === "admin"`。
- 演示账号由 `AYB_ENABLE_DEMO=true` 开启。
- 生产环境由首个注册账号或 `AYB_ADMIN_EMAIL` 指定管理员。

### 内容合并

```text
词条：
src/data/{dictionary,lexicon,bulk} → syncWordSeeds() → words
admin 上传 → word_overrides
getContentWords() → words LEFT JOIN word_overrides (+ 仅覆盖词) → practicalTranslit

课程 / 课文 / 文化：
src/data/* (seed) + custom_* 表的 payload_json
→ mergeById(base, custom)
→ getContent*()
```

- 词种子只由 TS 文件决定；管理员不能删除种子，只能覆盖或删除覆盖。
- 同 `id` 覆盖 seed；删除覆盖 = 恢复 seed；仅存在于覆盖表的词在词典末尾追加。
- `/admin/library` 与 `/admin` 的 snapshot 同时返回 custom 和 merged，前端无需二次请求。
- 单词 snapshot 使用 `overriddenWordIds`（只含覆盖了种子的 id），不会把 2,115 个种子 id 发给浏览器。

### 管理员 API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/admin/words` | 词条批量上传/覆盖 |
| DELETE | `/api/admin/words/[id]` | 删除自定义词条 |
| POST | `/api/admin/lessons` | 语法课批量上传/覆盖 |
| DELETE | `/api/admin/lessons/[id]` | 删除自定义课 |
| POST | `/api/admin/reading` | 课文上传/覆盖 |
| DELETE | `/api/admin/reading/[id]` | 删除课文覆盖 |
| POST | `/api/admin/culture` | 文化条目上传/覆盖 |
| DELETE | `/api/admin/culture/[id]` | 删除文化覆盖 |

所有接口都检查登录 + admin；校验在 `src/lib/server/admin-validation.ts`。

### 动态页面的关键决定

- `/reading/[slug]`、`/culture/[slug]` **不要**加 `generateStaticParams`。
- 原因是内容可被管理员覆盖；静态化会继续展示旧 seed。
- `/reading`、`/culture`、`/dictionary` 列表页通过 `getContent*` 读取 SQLite，已显式 `export const dynamic = "force-dynamic"`。
- sitemap 同样读取合并后的内容，也必须是 `force-dynamic`。
- 这些导出同时避免 `next build` 触发数据库初始化；`db.ts` 里还有构建期主动报错作为第二道防线。

## 2. 常用命令

```powershell
npm run dev
npm run typecheck
npm run build
npm run qa
```

生产：

```powershell
$env:NODE_ENV="production"
$env:AYB_ENABLE_DEMO="true"
$env:AYB_DATA_DIR="C:\Users\lvhan\Desktop\test\Armenian\qa-output\web-data-current"
$env:NEXT_PUBLIC_SITE_URL="http://localhost:3000"
npm start
```

E2E：

```powershell
$env:AYB_BASE_URL="http://localhost:3000"
npm run qa
```

`npm run qa` 会跑 `tests/e2e.mjs`，覆盖：

- 浅色默认主题 / 深色切换
- 词典搜索、长词、弹窗、键盘快捷键
- 演示登录
- 复习翻面、评分
- 语法页、课程页、测验
- 课文索引/详情、印刷/手写切换
- 文化索引/详情
- 管理员模板下载/上传/删除
- `/admin/library` 页面存在
- 写作新建、自动保存、删除

它不会完整测试管理员课文/文化的创建-覆盖-删除；改动这块时要额外手工/API 验证。

## 3. 常用测试脚本

仓库里的 `qa-output/*.mjs` 是本地验证脚本（多数不进 git）。常用模式：

```js
import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3000/path", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: "qa-output/shot.png" });
await browser.close();
```

移动端：

```js
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
```

检查横向滚动：

```js
await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
```

## 4. 常见坑

### Windows 文件写入

- `ReplaceFileW EIO (Win32 1175)` 偶发；同一编辑重试一次即可。
- 不要为了绕过而整文件粗暴覆盖；先 read 再 edit。

### 构建与服务

- `next build` 前停掉 `next start` / `next dev`，否则 `.next` 可能冲突。
- `next dev -- -p 3001` 会同时带脚本里的 `-p 3000`，但命令行后面的 `-p 3001` 生效；确认输出端口。
- `public/` 是运行时静态资源，替换 favicon 不一定要重建，但代码改动必须重建。

### 内容覆盖

- 管理员覆盖不生效，第一反应检查详情页是否被 `generateStaticParams` 静态化。
- 删除自定义后，页面要重新读取合并内容；`revalidatePath("/", "layout")` 已处理。

### SQLite / node:sqlite

- `node:sqlite` 是实验 API；Node 22 会打印 `ExperimentalWarning: SQLite is an experimental feature`，不影响功能。不要因此引入 better-sqlite3 等原生依赖。
- `DatabaseSync` 是同步 API：在事务回调里不要 `await`；`withTransaction` 会拒绝返回 thenable 的回调。
- 写事务统一 `BEGIN IMMEDIATE`，避免读升级写造成 `SQLITE_BUSY`；异步准备（哈希密码、读取旧 JSON）放在事务外。
- WAL 模式下备份前应停止服务，或连同 `ayb.sqlite-wal` / `ayb.sqlite-shm` 一起复制；单独复制主文件可能缺少最近写入。
- 只有一个应用实例可以写同一个数据库；多实例请换 Postgres。
- `review_states.due` 是 ISO 字符串，SQL 里用 `due <= ?` 做字典序比较即可（全部由 `toISOString()` 生成，格式一致）。
- 种子哈希保存在 `app_meta.words_seed_hash`；修改词表转换逻辑时提升 `WORD_SEED_VERSION`，否则旧库不会重建 `words`。
- 旧 JSON 只迁移一次：`app_meta.initialized` 一旦为 `1`，`.data/ayb.db.json` 就不再被读取。

### 字体

- `next/font` 的 Latin fallback 曾把拉丁字符渲染成 Noto Sans；最终改成手工 `@font-face` + `unicode-range`。
- Poqrik 没有数字；不要在它的 range 里加数字。
- First Time Writing 有数字，但和亚美尼亚连笔不搭；它只用于拉丁注释。
- **两个手写字体必须是两个 family**（`Ayb Armenian Hand` / `Ayb Latin Hand`）。Chromium 在同一 family 里放带 `unicode-range` 的字面时，会丢掉 `descent-override`，手写尾巴重新溢出、被下一行盖住。
- Poqrik 的真实墨迹是 0.79em ~ -0.449em；`size-adjust: 112%` 后必须配 `ascent-override: 79%` / `descent-override: 45%`，否则 1.4 行高装不下 `լ/ղ/ձ/ց` 的尾巴。
- `.font-hand` 左右各留 0.34em / 0.2em：Poqrik 的起笔和收笔都超出字宽；底部 0.2em 兜住 `leading-none` 的大字。
- favicon 是路径，不依赖字体；如果改字体，图标不会自动变。

### 扩展词库与音频

- 扩展词库在 `src/data/lexicon/entries.ts`（1,297 词），批量精选词在 `src/data/bulk/entries.ts`（682 词），源数据与精编词分开，但 `getContentWords()` 会合并为使用可读转写 id 的词条；词典、主题筛选和复习队列都包含它们。
- UI 不再区分扩展词：没有 EXT 标记、没有来源提示，也不要说“不进入复习”。中/英/俄释义与例句为模型生成，发布前建议母语者复核（只写工程文档）。
- 旧 bulk 保留了 12,486 条只有英文释义的 Wiktionary 原始条目，现已被 682 条精选词替代：按英语释义常用度筛选，人工/模型逐条过滤缩写、单字母、屈折变体、方言借词、同义重复与生僻专名，并补齐四语释义与五字段例句。
- 数据来源：kaikki.org 的亚美尼亚语 JSONL（Wiktionary，CC BY-SA）+ hermitdave/FrequencyWords 的 `hy_full.txt`。筛选时跳过字母名/形式条目，把屈折形式解析到词元。
- 音频生成：`npx tsx scripts/generate-audio.ts`。需要 eSpeak NG 的 `hy` 语音和 lame；本地用 `ESPEAK_BIN` / `ESPEAK_DATA` / `ESPEAK_LIBS` / `LAME_BIN` 指向解包后的二进制。
- 产物：`public/audio/<fnv1a>.mp3` + `manifest.json`；`AudioButton` 有 hy 语音时用 TTS，否则播预生成文件，都没有才提示。
- Chrome/Edge 不提供 hy-AM 语音，不要删掉预生成音频退回纯 TTS。新增可朗读文案后必须重跑生成脚本。

### 转写

- 全站（词典、复习、首页）在 `getContentWords()` 里用 `src/lib/practical-translit.ts` 重算 `translit`，词头和例句都覆盖。
- 规则：ծ/ց→ts，ջ→j，ձ→dz，չ/ճ→ch，շ→sh，ժ→zh，խ→kh，ղ→gh，ռ→rr；词首 ե→ye、ո→vo、և→yev；թ/ք/փ→t/k/p；不写撇号或变音符号；ը→ə。
- 源数据（`src/data/lexicon/entries.ts`、精编 JSON）里可能还是 Wiktionary 学术罗马化，只作源数据，不要直接展示。
- 词条 id 仍由旧转写生成，**不要**因为转写变化去改 id，否则复习记录会失效。

### 测试

- 管理员删除偶发失败：等待已调到 1500ms；仍失败就检查残留数据。
- React #418 只出现过一次，重跑消失；持续出现再查 HTML 嵌套/首屏状态。
- E2E 会修改演示账户数据；用独立 `AYB_DATA_DIR` 或临时目录。
- 生产 cookie 是 `secure`；非 localhost 的 HTTP 环境会登录不上，正式环境要 HTTPS。

### 响应式

- 桌面导航 `lg` 才显示，以下用 Dock。
- 7 项 Dock 在 360–390px 下要检查；`min-w-[44px]` 是当前底线。
- 768/1024 是容易出重叠的宽度。

## 5. 添加一种新的可编辑内容

以 reading/culture 为模板：

1. `src/data/<type>/types.ts` 定义类型。
2. `src/data/<type>/index.ts` 导出种子、标签、辅助函数。
3. `src/lib/server/db.ts` 的 `CustomContentTable` 加表名，并在 `SCHEMA_SQL` 建 `id + payload_json + updated_at` 表。
4. `src/lib/server/content.ts` 用 `listCustomPayloads<Type>(table)` + `mergeById` 提供 `getContent<Type>`。
5. `src/lib/server/admin-content.ts` 加 snapshot 字段、save/delete、计数、merged 数组；复用 `savePayloads` / `deletePayload`。
6. `src/lib/server/admin-validation.ts` 加 zod schema。
7. `src/app/api/admin/<type>/route.ts` + `[id]/route.ts`。
8. `/admin/library` 加 tab / 编辑器（或单独管理页）。
9. 页面使用 `getContent*`，不要用静态数组；列表页记得 `force-dynamic`。
10. sitemap、导航、首页入口、README、E2E 同步。

## 6. 当前测试盲区

- 管理员课文/文化的完整 UI CRUD 没有进 E2E；只有 API/手工测过。
- 朗读依赖浏览器 `speechSynthesis`，没有自动化音频测试。
- 1915 等历史内容的准确性没有自动校验。
- 字体在不同系统上的回退没有跨设备快照。
- 深色模式只做了页面级截图，没有逐组件回归。
- 旧 `.data/ayb.db.json` 迁移没有自动化测试；改动 `insertSnapshot` / 规范化逻辑时要手工准备旧文件验证。
- SQLite 备份/恢复与 WAL checkpoint 没有自动化测试。
- `next build` 不初始化数据库这一点没有测试断言，只能人工检查数据目录。
