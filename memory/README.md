# memory/ — 项目记忆

`AGENT.md` 是规则，`memory/` 是**为什么会有这些规则**、当前内容状态、以及踩过的坑。

## 读的顺序

1. [`user-principles.md`](user-principles.md) — 用户到底在意什么
2. [`content-and-typography.md`](content-and-typography.md) — 内容与排版细节
3. [`engineering-and-qa.md`](engineering-and-qa.md) — 架构、测试、常见错误
4. [`session-retrospective.md`](session-retrospective.md) — 这段开发过程的复盘

## 当前快照

截至 `ec4f769`（2026-10-18）：

| 项目 | 数量 |
| --- | --- |
| 词典 | 136 词 |
| 语法 | 15 节 / 约 174 分钟 / 48 道自测 |
| 课文 | 3 篇 / 约 337 个亚美尼亚语词 |
| 文化 | 11 条：历史 2、文化 3、人物 3、地理 3 |
| 导航 | 桌面 7 项，移动 Dock 7 项 |
| 字体 | Noto Sans、Noto Sans Armenian、Poqrik dzeragir、First Time Writing |

课文拆分：

| 课文 | 级别 | 词数 | 生词 | 语法点 |
| --- | --- | ---: | ---: | ---: |
| 我的早晨 | A2 | 84 | 18 | 5 |
| 亚美尼亚的创伤（阿博维扬，5 段） | B2 | 126 | 29 | 7 |
| 我爱我甜蜜的亚美尼亚（恰连茨，全诗 4 节） | B1 | 127 | 37 | 5 |

## 更新规则

- 新的**持久偏好/禁忌** → 更新 `user-principles.md`。
- 新的**内容/排版决定** → 更新 `content-and-typography.md`。
- 新的**技术坑/测试方式** → 更新 `engineering-and-qa.md`。
- 一次较大的开发阶段结束后 → 在 `session-retrospective.md` 末尾追加一段，不要重写历史。
- 数字以页面/README 为准；本文件是快照，过期就在下一段注明“截至某提交”。

## 不放进 memory 的东西

- 一次性的命令输出、临时截图路径。
- 未经验证的猜测。
- 用户的私人信息（本项目没有）。
- 大段代码；代码在仓库里，memory 只记决策与原因。
