---
issue_number: 83
type: blog
title: 我的 Pi + Codex + Paseo workflow
slug: pi-codex-paseo-workflow
description: 从浏览器自动化、桌面操作、多 Agent 与远程接管、Pi 原生工具改造、提问与用量分析五项功能出发，用图表介绍我的 Pi + Codex + Paseo 配置。结合此前的实测和使用经历，说明对应工具及选择理由。
created_date: '2026-09-21'
update_date: '2026-09-21'
published_at: '2026-09-21T16:36:44Z'
updated_at: '2026-09-21T16:43:52Z'
tags:
- name: ai-workflow
  key: ai-workflow
- name: pi
  key: pi
- name: paseo
  key: paseo
---

> 为学日益，为道日损。——《道德经》第四十八章（[原文](https://zh.wikisource.org/zh-hant/道德經_(王弼本))）

折腾了一圈，我的 Pi Coding Agent 配置终于到了一个舒服的位置，最近半个月用起来很顺手。最开心的是，用这套组合做出了几个小项目，也有人开始用了。数字都很小，但还是很有成就感。

| 项目                                                                      | 做什么                     | 收到的一点反馈                                                                                        |
| ----------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| [pi-ask](https://github.com/geoqiao/pi-tools/tree/main/packages/pi-ask) | 交互式提问，支持 Paseo          | 8/22—9/20，npm 下载 **672 次**                                                                     |
| [paseo-stuff](https://github.com/geoqiao/paseo-stuff)                   | Paseo 显示与 Agent 接入插件    | **2 stars**，用户[专门发 Issue 感谢](https://github.com/geoqiao/paseo-stuff/issues/7) DeepSeek 插件省去了配置 |
| [md2xarticle](https://vibecafe.ai/products/cmu4b884000000agmn23vud8y)   | Markdown 转 X Article 草稿 | VibeCafe 统计，9/17 上线，截至 9/21 共 **59 UV、87 PV**                                                        |

我的使用前提是 **Codex 订阅为主，Claude 每月 20 美元订阅和少量 DeepSeek API 为辅**。[Pi](https://github.com/earendil-works/pi) 的可定制性和[此前的评测表现](https://geoqiao.me/blog/which-ai-agent-harness-should-you-use-in-2026/)，让我把它作为底座，再围绕下面五项需要补能力。

## 1. 浏览器自动化：让 Agent 实际操作网页

我在[这条推文](https://x.com/geoqiao/status/2102040629924839621)里记录了选择：**功能完整、适合 Agent，又不想换浏览器，就选 agent-browser。**

| 需要做什么          | 对应工具                                                           | 我选择的理由                                   |
| -------------- | -------------------------------------------------------------- | ---------------------------------------- |
| 浏览页面、填表、验证交互   | `agent-browser`                                                | 通过 CDP 操作 Chrome，功能完整，面向 Agent 设计，无需换浏览器 |

## 2. Computer Use：操作 macOS 应用

我用的 [codex-computer-use-mcp](https://github.com/tmustier/codex-computer-use-mcp) 是第三方扩展，把官方 macOS Computer Use 接进 Pi。最吸引我的是**能在后台操作，不抢我正在使用的窗口**，Agent 干活时我可以继续做自己的事。

## 3. Subagent、GUI 和远程控制： Paseo

[Paseo](https://paseo.sh/) 把项目、文件和多个 Agent 放在一个工作台里，也支持手机接管。[试过六款工具后](https://geoqiao.me/blog/agent-orchestrator-desktop-selection/)，我留下它，因为 **Pi、多模型、GUI、手机和多 Server** 能同时满足我的需要。

![Paseo 的多 Agent 分栏与文件编辑界面，来自此前的使用记录](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/312ca83c49e997dbdea0d3a24d458061c52d440b/assets/issues/67/42bb236c6cc366be.png)


### 模型按职责分工

| Profile | 模型与推理档位                   | 交给它什么             |
| ------- | ------------------------- | ----------------- |
| 默认      | Pi · Astra Medium         | 讨论、澄清需求、拆解任务和判断方案 |
| 执行实现    | Pi · Luna Max             | 范围明确、结果可验证的常规实现   |
| 只读整理    | Pi · Codex Spark XHigh    | 窄范围查找、资料收集和日志整理   |
| 复杂实现    | Pi · Astra XHigh          | 有具体证据表明存在硬技术难点的实现 |
| 三方建议    | Claude Code · Opus 5 High | 独立评估方案、质疑结论和关键复核  |

**小任务直接做，值得分工时才调子 Agent。** 在实际使用中， luna Max 承担了我总 token 用量的 25% 左右，节省了很多订阅额度。

![](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/ba10278d0cc0541e462c0a2a96bd965d6d8f7bb5/assets/issues/83/ac31e56f13593c73.png)

## 4. Pi 原生工具改造：减少往返，接着做长任务

[pi-codex-conversion](https://github.com/IgorWarzocha/howaboua-pi-stuff/tree/main/packages/pi-codex-conversion) 负责 Code mode 和 Compaction ，我当前的关键选择如下。

| 改造什么   | 当前配置                           | 我选择的理由         |
| ------ | ------------------------------ | -------------- |
| 工具调用   | **Notebook Mode**，用代码组合操作并保留变量 | 减少模型往返，复用中间结果  |
| 长会话上下文 | **原生 Responses 压缩**            | 处理长任务的上下文压缩与接续 |

```mermaid
flowchart LR
    A["模型"] --> B["exec：多步工具操作"]
    B --> C["筛选结果 · 保留状态"]
    C --> A
```

我的[单次长任务实验](https://geoqiao.me/blog/is-code-mode-the-future/)中，这套配置的 Token 消耗量**减少 75%**，估算费用 **降低 64%**。

## 5. 体验优化：方便回答，也能看清用量

这两个工具都是我在维护，分别解决“怎么把需求说清楚”和“Token 用在了哪里”。

| 工具                                                                          | 一句话介绍                      | 我选择的理由                                        |
| --------------------------------------------------------------------------- | -------------------------- | --------------------------------------------- |
| [pi-ask](https://github.com/geoqiao/pi-tools/tree/main/packages/pi-ask)     | 把关键问题变成交互式选项，支持 TUI / RPC  | 在 Paseo 里方便作答，常规实现细节继续交给 Agent                |
| [pi-usage](https://github.com/geoqiao/pi-tools/tree/main/packages/pi-usage) | 本地汇总多种 Agent 的 Token 和估算费用 | 上游是 vibeusage ，插件提供纯本地方案，统计各harness 、模型、项目的用量 |

pi-ask 延续自 `eko24ive/pi-ask`，我补充了 RPC 等能力，Paseo 中逐题作答。pi-usage 的金额按价格表估算，实际支出仍看账单。

## 安装入口

按需安装；登录、MCP、macOS 组件和权限等配置，见文中的项目链接。

```bash
pi install npm:pi-web-access
pi install npm:pi-mcp-adapter
pi install npm:codex-computer-use-mcp
pi install npm:@howaboua/pi-codex-conversion
pi install npm:@geoqiao/pi-ask
pi install npm:@geoqiao/pi-usage
pi install npm:pi-codex-image-gen
```

## 补充清单：正文之外还装了什么

除了以上提到的，我还有以下配置：

| 类型            | 工具 / Skill                                                                                              | 用途与补充说明                                  |
| ------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Pi 插件 | [pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter) | 按需发现 MCP 工具；`mcpScript` 批量编排串联、并行调用，筛选结果后交回模型，减少往返 |
| Pi 插件         | [pi-web-access](https://github.com/nicobailon/pi-web-access)                                            | 提供 Web search 能力                         |
| Pi 插件 / Skill | [pi-codex-image-gen](https://github.com/jvm/pi-mono/tree/main/packages/pi-codex-image-gen) / `imagegen` | 提供生图能力                                   |
| Skill         | `agent-reach`                                                                                           | 读取 X、B 站等平台内容，按平台选用对应工具                  |
| Skills        | `paseo` / `paseo-help` / `paseo-plugin`/`paseo-advisor`/`paseo-committee`/`paseo-handoff`               | paseo 自带的 skills ，我基本不会主动调用              |
| Skill         | `prototype`                                                                                             | Matt 系列 skills 中我唯一保留的，负责原型设计            |
| Paseo 插件      | [Readable Agent Activity](https://github.com/geoqiao/paseo-stuff/tree/main/plugins/agent-activity)      | 格式化、高亮工具输入输出，提高 paseo 中 tool result 的可读性 |
| Paseo 插件      | [Math Renderer](https://github.com/geoqiao/paseo-stuff/tree/main/plugins/math-renderer)                 | 回复完成后渲染块级 LaTeX 公式，当前为实验版                |
| Paseo 插件      | [DeepSeek Harness](https://github.com/geoqiao/paseo-stuff/tree/main/plugins/deepseek-harness)           | 通过官方 ACP 接口把 DeepSeek Harness 接入 Paseo   |
| Paseo 插件      | [MaKa](https://github.com/geoqiao/paseo-stuff/tree/main/plugins/maka)                                   | 通过 ACP 接入 MaKa，作为另外一个 Agent 入口           |
