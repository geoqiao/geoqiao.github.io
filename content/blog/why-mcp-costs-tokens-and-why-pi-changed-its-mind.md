---
issue_number: 100
type: blog
title: MCP 为什么费 token？Pi 为什么态度大转变
slug: why-mcp-costs-tokens-and-why-pi-changed-its-mind
description: MCP 的 token 开销在工具说明和工具输出两处；Pi 作者曾因此拒绝 MCP，2026 年 9 月 Pi 却借 Code Mode 内置了它。
created_date: '2026-10-15'
update_date: '2026-10-15'
published_at: '2026-10-15T15:07:06Z'
updated_at: '2026-10-15T15:07:06Z'
tags:
- name: ai-agent
  key: ai-agent
- name: pi
  key: pi
- name: code-mode
  key: code-mode
---

## 1. "MCP 费 token"，费在哪

Agent 每次请求模型，都要把工具说明、对话历史和上一步的工具结果一起发过去。MCP 的开销主要在两处。

### 第一处：工具说明

Anthropic 在 2025 年 11 月写道，多数 MCP client 会在一开始就把全部工具定义放进上下文，每次请求都带着，这一轮用不用得上都一样。

| 来源 | 工具数 | 工具说明占用 |
|---|---:|---:|
| Playwright MCP | 21 | 13.7k token（Claude 上下文的 6.8%） |
| Chrome DevTools MCP | 26 | 18.0k token（9.0%） |
| GitHub MCP | 35 | 约 26K token |
| Slack MCP | 11 | 约 21K token |
| 5 个 server 合计 | 58 | 约 55K token |

前两行来自 Pi 作者 Mario Zechner 的测量，后三行来自 Anthropic 的工程博客。

### 第二处：工具输出

模型直接调用工具时，每个结果都要回到上下文里。以 SQL MCP 为例：`SELECT * FROM orders` 一次回来一万行，全部进入上下文，而模型要的可能只是几行或一个汇总数。

结果进了上下文就留在历史里，之后每次请求都要再发一遍。我 9 月的[长任务实验](https://geoqiao.me/blog/is-code-mode-the-future/)里，Pi 用原生工具完成任务，模型响应了 129 次，每次平均带着 13.2 万 token 的输入。

## 2. 2025 年，Pi 为什么说不

2025 年 11 月 2 日，Mario 写了 [What if you don't need MCP at all?](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)。他的意见里有两条正是上面两笔开销：流行的 MCP server 工具多、说明长，占掉大量上下文；MCP 的结果不能组合，任何输出都得先经过 Agent 的上下文，才能存盘或和别的结果合并。他的替代方案是命令行工具加 README，Agent 用到时才读。

11 月 30 日，他在 [What I learned building an opinionated and minimal coding agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) 里说得更死：

> pi does not and will not support MCP.（Pi 现在不支持、以后也不会支持 MCP。）

理由同样是：Playwright MCP 和 Chrome DevTools MCP 的工具说明开工前就用掉 7% 到 9% 的上下文窗口。

## 3. 2026 年 9 月，Pi 内置了 MCP

2026 年 9 月 25 日，Armin Ronacher 在 Pi 仓库提交了 [PR #10040：Codemode and MCP](https://github.com/earendil-works/pi/pull/10040)。Code Mode 和 MCP 是在同一个 PR 里一起加进来的。对 MCP，PR 说明里写的是：

> We have mixed feelings about MCP, but some uses of it are responsible, and the baseline fits reasonably well into pi.（我们对 MCP 感情复杂，但有些用法是负责任的，这套基础实现也和 Pi 合得来。）

评论区有人引用 Mario 的文章，问他的想法变了什么。截至我写这篇时，PR 里没有看到 Mario 本人的回复；Armin 回答说 MCP 完全是可选的。9 月 29 日 PR 合并，随 Pi 0.99.0 发布。

## 4. Code Mode 怎样管住这两笔开销

### 工具说明：用到再搜

现在的 Pi 里，MCP 工具默认是 `codemode` 暴露方式：既不声明给模型，也不列进 `codemode` 工具的说明。系统提示词里每个 server 只占一行简介，模型需要时在脚本里用 `searchTools()` 去查。这和 Mario 当年的 README 方案一样：用到时才付这笔 token。

第一版还不完全是这样：0.99.0 会把这些 server 列进 `codemode` 的说明里，0.99.2 才改成上面的做法。

### 工具输出：在脚本里筛完再交给模型

`codemode` 让模型写 JavaScript，在沙箱里调用工具。脚本拿到完整的 MCP 结果，只有脚本最后输出的内容会进入模型的上下文。那一万行查询结果，可以先存进临时文件，再用 Python 加工，只把要的几行交给模型。

两道保护：

- 直接调用 MCP 工具时，超过 20 KB 的文本结果会删掉中间部分，全文存进临时文件。
- 脚本输出默认上限是 10,000 token，超过时保留开头和结尾，全文同样存进临时文件。

一段脚本还能把几次工具调用并成一次，历史被重新发送的次数也少了。同一个长任务，我给 Pi 换上 Code Mode 之后，模型响应从 129 次降到 42 次，累计 token 少了 75%。当时用的是 `pi-codex-conversion` 插件提供的 Code Mode。

## 5. Pi 改变的是什么

Mario 在《What if you don't need MCP at all?》的结尾写道，这个通用原则适用于任何带代码执行环境的 Agent。我的理解是，Pi 后来做的正是这个环境：MCP 工具成了沙箱里可以搜索、可以调用的一组函数，说明用到才查，输出筛过才给，Mario 反对的两件事都不再发生。这是我的推断，PR 原文只说"这套基础实现和 Pi 合得来"。

## 6. 我现在怎么用

我的完整配置见 [Pi Agent 配置清单（2026-10）](https://geoqiao.me/blog/whats-on-my-pi-agent-october-2026/)。0.99.0 发布后，我卸掉了 `pi-mcp-adapter` 和 `pi-codex-conversion` 两个插件，改用 Pi 内置的 MCP 和 `codemode`，并把 `codemode` 设成 `only`：

```json
{
  "defaultTools": ["read", "bash", "edit", "write", "codemode"],
  "codemode": { "mode": "only" }
}
```

MCP server 保持默认的 `codemode` 暴露方式。

## 参考资料

- Mario Zechner，[What if you don't need MCP at all?](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)，2025-11-02。
- Mario Zechner，[What I learned building an opinionated and minimal coding agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)，2025-11-30，"No MCP support" 一节。
- Anthropic，[Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)，2025-11-04。
- Anthropic，[Introducing advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use)，2025-11-24。
- Pi，[PR #10040：Codemode and MCP](https://github.com/earendil-works/pi/pull/10040)，2026-09-25 提交，09-29 合并。
- Pi 1.2.0 自带文档：CHANGELOG（0.99.0、0.99.2）、`docs/mcp.md`、`docs/codemode.md`。
- 我的实验：[Pi Code Mode 实测](https://geoqiao.me/blog/is-code-mode-the-future/)，长任务 token 减少 75%。
