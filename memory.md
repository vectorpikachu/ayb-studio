# memory.md

这是项目记忆的入口。详细的、分主题的记忆在 [`memory/`](memory/README.md)。

## 最该记住的 10 条

1. 只做网站：不要 Docker、Electron、exe；部署是 `npm run build && npm start`。
2. 亚美尼亚手写必须是真连笔（Poqrik），不是“手写风格的印刷体”。
3. 手写要出现在单词、例句、字母、课文里，不能只做标题。
4. 字母卡要同时有**大写 + 小写**手写。
5. 手写串里的数字用 Noto Sans Armenian 印刷体；Poqrik 没有数字。
6. 语法是 **7 个格**；B1 讲完七格与变格，再进 B2。12 不是通行格数。
7. 文学课文不能只有一句/两行；要有原文、来源、翻译、生词、语法，诗要保留换行。
8. 管理员必须能对词条、语法、课文、文化增删改；同 id 覆盖，删除覆盖恢复内置。
9. Logo / favicon / PWA / Apple 图标统一用亚美尼亚 **Ա**，不是拉丁 A。
10. 改完要 typecheck、build、生产模式 E2E，并看 390/768/1024/1440。

## 分主题

- [`memory/user-principles.md`](memory/user-principles.md) — 用户准则、禁忌、协作方式
- [`memory/content-and-typography.md`](memory/content-and-typography.md) — 内容数量、课程顺序、字体、数字、品牌
- [`memory/engineering-and-qa.md`](memory/engineering-and-qa.md) — 架构、数据流、命令、测试、坑
- [`memory/session-retrospective.md`](memory/session-retrospective.md) — 这段开发过程的复盘与待办

## 使用方式

- 新 agent 先读 [`AGENT.md`](AGENT.md)，再读本文件，再按任务读 `memory/` 里的对应主题。
- 出现新的持久偏好或踩坑，更新对应的 `memory/*.md`，不要只留在聊天里。
- 数量/提交号会过期；以页面、`README.md` 和 `git log` 为准。
