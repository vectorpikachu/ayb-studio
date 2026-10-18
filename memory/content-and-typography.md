# 内容与排版

## 1. 内容地图

### 词典

- 136 个东亚美尼亚语高频词，10 个主题。
- 每词有亚美尼亚语、英语、俄语、中文释义、转写、词性、级别、原创例句。
- 词条与例句都带印刷体 + 手写体对照。
- 数据在 `src/data/dictionary/`。

### 语法

15 节，约 174 分钟，48 道自测题：

| 级别 | 节数 | 内容 |
| --- | ---: | --- |
| A1 | 7 | 字母、发音、人称、系词、名词、现在时、疑问否定 |
| A2 | 1 | 过去与将来 |
| B1 | 3 | 格与后置词、七个格全景、变格/复数/例外 |
| B2 | 4 | 关系从句、条件与虚拟、被动/使役、转述与传闻 |

重要顺序：**B1 先讲完七个格，再进 B2**。第 9 课只讲五个高频后缀是“入口”，第 10 课补全七格，第 11 课讲词干、复数和例外。不能把第 9 课当成全部格系统。

关于“12 个格”：

- 标准语法 7 格；
- 也有 6 格分析（属格/与格合并）；
- 12 常见于 12 年级教材、变格类型、格与数的组合；
- 不要把课程改成 12 格。

### 课文

3 篇，共约 337 词：

1. **《我的早晨》**（A2，84 词，18 生词，5 语法点，12 分钟）
   - 原创日常生活短文，现在时、位格、工具格、属格、时间表达。
2. **《亚美尼亚的创伤》**（B2，126 词，29 生词，7 语法点，28 分钟）
   - 阿博维扬《Վերք Հայաստանի》序言 5 段选读；
   - 原文 + 现代亚美尼亚语改写 + 中文 + 注释；
   - 来源：Wikisource，公共领域。
3. **《我爱我甜蜜的亚美尼亚》**（B1，127 词，37 生词，5 语法点，16 分钟）
   - 恰连茨全诗 4 节；
   - 逐节中文翻译；
   - 公共领域。

阅读器能力：

- 印刷体 / 手写体切换；
- 中文对照开关；
- 逐段朗读（浏览器 speechSynthesis，`hy-AM`）；
- 生词表、语法点、takeaways；
- 诗歌保留换行（`whitespace-pre-line`）。

### 文化

11 条，4 类：

- 历史 2：405 年字母表、1915；
- 文化 3：十字石、杜杜克、拉瓦什；
- 人物 3：马什托茨、阿博维扬、恰连茨；
- 地理 3：亚拉拉特山、埃里温、塞凡湖。

路径：`/culture`，详情 `/culture/[slug]`。每条有章节、关键事实、关联阅读。

### 管理员内容

- `/admin`：词条/语法 JSON 上传、覆盖、删除。
- `/admin/library`：课文/文化 JSON 编辑器，可新建、修改、删除、下载。
- 数据是 `static seed + custom override`：
  - 同 `id` 覆盖；
  - 删除覆盖恢复内置；
  - 不能删除种子本身。

## 2. 字体系统

| 用途 | 字体 |
| --- | --- |
| 拉丁 / UI / 中文 | Noto Sans（`--font-sans`） |
| 亚美尼亚语印刷体 | Noto Sans Armenian（`--font-armenian`） |
| 亚美尼亚语连笔手写 | Poqrik dzeragir（`--font-hand` 的第一顺位） |
| 拉丁手写注释 | First Time Writing |
| 展示标题 | `--font-display`（当前与正文字体体系配合） |

字体文件在 `public/fonts/`，许可文本也在那里。

### 关键 CSS

```css
@font-face {
  font-family: "Ayb Hand";
  src: url("/fonts/poqrik-dzeragir.woff2") format("woff2");
  unicode-range: U+0530-058F; /* 亚美尼亚字母 */
}

@font-face {
  font-family: "Ayb Hand";
  src: url("/fonts/first-time-writing.woff2") format("woff2");
  unicode-range: U+0020-002F, U+003A-0040, U+0041-005A, U+005B-0060,
    U+0061-007A, U+007B-007E, U+00A0-00FF, U+2000-206F, U+20AC;
    /* 故意不含 U+0030-0039 */
}
```

- 数字不落在 First Time Writing；
- 数字回退到 `var(--font-armenian)`（Noto Sans Armenian）印刷体；
- `HandText` 进一步把文化标题里的数字缩到 `0.78em`；
- `.font-hand` 设置 `font-variant-numeric: lining-nums tabular-nums`。

### 手写 / 印刷体并置

- 词典词条：大号印刷词 + 手写词；
- 例句：印刷例句 + 手写例句；
- 字母表：印刷大写+小写，手写大写+小写；
- 课文：工具栏切换印刷/手写；
- 文化标题：手写 `titleHy`，数字用印刷体；
- 复习卡：印刷词 + 手写词。

### Logo 与图标

- 页头 `src/components/brand.tsx` 使用 `Ա`。
- `public/favicon.svg` 是从 Noto Sans Armenian 提取的 `Ա` 矢量路径，不依赖系统字体。
- `public/icon-192.png`、`icon-512.png`、`apple-touch-icon.png` 都由同一个 SVG 渲染。
- 不要改回拉丁 A。

## 3. 视觉规范

- 背景：暖纸色 + 杏色/石榴色光场。
- 玻璃：`.glass`、`.glass-soft`、`.glass-strong`、`.surface-card`、`.modal-glass`。
- 卡片圆角 18–28px；标题字距收紧；正文行高 1.8–2.0。
- 动效克制：淡入、轻微上移、`--ease-out-expo`；不要弹跳。
- 深色模式有独立变量；不要写死白色背景。
- 页面最大宽度由 `container-ayb` 控制。
- 导航桌面 `lg` 才显示；以下用 `MobileDock`。

## 4. 内容质量清单

新增/修改课文时：

- [ ] 原文有来源，公共领域或已获授权
- [ ] 作者、作品、年份、译者/改写说明
- [ ] 中文翻译逐段对应
- [ ] 古旧文本有现代亚美尼亚语改写
- [ ] 生词表有转写、中文、必要的语体注释
- [ ] 语法点有解释 + 至少 2 个例句
- [ ] takeaways 不是空话
- [ ] 诗歌用 `\n` 保留换行
- [ ] 词数/生词数/语法点数在页面自动统计，README 手动同步
- [ ] 对照 `src/data/reading/types.ts` 检查字段

新增文化条目时：

- [ ] 分类只能是 history / culture / people / geography
- [ ] 标题、亚美尼亚语标题、副标题、摘要
- [ ] 至少 1 个章节，每章至少 1 段
- [ ] 关键事实 2–4 条
- [ ] 关联链接是站内路径
- [ ] 敏感历史内容克制、可核对

## 5. 许可与来源

- Abovyan《Վերք Հայաստանի》为公共领域；当前选段来自 Wikisource 序言。
- Charents 于 1937 年去世，作品在多数司法辖区已进入公共领域；引用时保留作者与作品名。
- Poqrik dzeragir 的许可说明在 `public/fonts/LICENSE-POQRIK-DZERAGIR.txt`。
- First Time Writing 为 CC0，说明在 `public/fonts/LICENSE-FIRST-TIME-WRITING.txt`。
- 不要在未确认版权的情况下加入现代诗歌/歌词。
