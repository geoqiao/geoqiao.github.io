---
issue_number: 49
type: blog
title: 我试了 6 款 Agent Orchestrator，这是我的最终选择
slug: agent-orchestrator-desktop-selection
description: 如何选择桌面 Agent 管理工具？我按 Pi 支持、GUI、多模型和手机远程接管需求，比较了 Codex Desktop、Orca、T3 Code、Superset、Pigi 与 Paseo，并说明为什么选 Paseo。这是我的试用取舍，不是六款产品的全面评测。
created_date: '2026-08-09'
update_date: '2026-08-09'
published_at: '2026-08-08T19:20:33Z'
updated_at: '2026-09-10T05:25:55Z'
tags:
- name: pi
  key: pi
- name: agent-orchestrator
  key: agent-orchestrator
- name: paseo
  key: paseo
---

我的结论建立在“要用 Pi，还要多模型、手机接管和多个 Server”这组需求上；只要 GUI，或者接受 Terminal-first，选择就可能不同。

我喜欢 Codex Desktop 的 GUI，但不喜欢 Codex 的 harness。

我真正想找的是：Codex Desktop 的体验，加上 Pi 作为 harness。

过去我一直使用 Pi + Herdr。这套组合简单、省 token，也能灵活编排不同模型；唯一的问题是，它仍然是 Terminal 工作流。我希望有一个操作门槛更低的 GUI，还能让我在手机上接管任务。

因此，我试了 Codex Desktop、Orca、T3 Code、Superset、Pigi 和 Paseo。最终选择了 Paseo。

这篇记录的是我在 2026 年 8 月的试用，不是六款产品的全面评测，Orca 和 Superset 尤其没有深度使用。文中的“目前”“当前版本”和功能限制均指当时，不代表今天的软件状态。

## 我在找什么

1. 支持 Pi；
2. 不同任务可以使用不同模型；
3. 有真正好用的 GUI，而不是换皮 Terminal；
4. 支持手机、远程连接和多个 Server。

## 为什么我坚持使用 Pi

Pi 足够简单，不会在模型外面堆太多默认行为。我的长期体感是：它更省 token，但任务完成度并不输 Codex 或 Claude Code。

对我来说，Pi 在效果、token 消耗和可定制性之间更平衡。

## 为什么不是 Codex Desktop

<img width="1200" height="760" alt="Image" src="https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/c034e81a8451f18d771f8f8c3523d6ad127abf35/assets/issues/49/18d6a1c382da5ff8.png" />

Codex Desktop 仍然是我心中 Desktop Agent 的体验标杆，但我最终放弃了它：

- 在我的 MacBook M1 Pro 上，简单问答也会让温度超过 50℃，风扇持续运转；
- 同样使用 ChatGPT Pro，我在 Pi 中能完成更多任务；
- subagent 的模型配置不够自由，无法充分利用我的其他模型订阅。

它解决了 GUI，却没有解决我最在意的 harness 问题。

## 我尝试了 6 个工具

### 1. Codex Desktop：最好的 GUI 之一

优点是完整、易用，Workspace、任务、Diff 都做得很好；问题是资源占用、token 消耗和模型自由度不适合我。

### 2. Orca：功能强，但仍然太像 Terminal

<img width="1200" height="667" alt="Image" src="https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/c034e81a8451f18d771f8f8c3523d6ad127abf35/assets/issues/49/b8976f5cdb4a11d6.png" />

Orca 支持多种 CLI Agent、worktree、Git、Remote 和 Mobile，功能非常完整。但它仍然是明显的 Terminal-first 产品，而我已经看腻了终端界面，所以没有深度使用。

### 3. T3 Code：最好看的 UI

<img width="1200" height="805" alt="Image" src="https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/c034e81a8451f18d771f8f8c3523d6ad127abf35/assets/issues/49/3cd05f13813fd3a2.png" />

T3 Code 是这几款产品中我认为最漂亮的。如果你使用 Claude Code、Codex 或 OpenCode，非常值得尝试。

但它目前还不支持 Pi。

### 4. Superset：仍然是 Terminal-first

<img width="1200" height="833" alt="Image" src="https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/c034e81a8451f18d771f8f8c3523d6ad127abf35/assets/issues/49/64365340050e69fc.png" />

Superset 支持并行 Agent、worktree、Diff 和 Editor，功能并不弱。但它的核心体验仍然偏 Terminal，我没有继续深度使用。

### 5. Pigi：最直接的 Pi Desktop GUI

<img width="1200" height="757" alt="Image" src="https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/c034e81a8451f18d771f8f8c3523d6ad127abf35/assets/issues/49/9e1b9111fefdee3d.png" />

Pigi 会直接读取 Pi 的 models、skills 和 settings。它没有重新发明 Pi，只是给 Pi 加上一套干净的桌面界面。

如果需求只是“Pi + GUI”，它很值得关注。但在我看来，它的社区和生态还不够成熟，目前仍然更像一个个人项目。

### 6. Paseo：最接近 GUI 版 Pi + Herdr

<img width="1200" height="686" alt="Image" src="https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/c034e81a8451f18d771f8f8c3523d6ad127abf35/assets/issues/49/bfba57b0fa63164a.png" />

Paseo 不一定每项都是第一，但它覆盖了我最在意的交集：Pi、subagent、多模型、Remote、Mobile 和多 Server。

## 为什么最终是 Paseo

### Remote 体验

Paseo 可以连接多个 Server。我能在同一台手机上分别处理工作和个人任务，离开电脑后也能查看进度、补充 prompt 或完成确认。

### Subagent 与模型配置

它有自己的 subagent orchestration CLI，体验很像 Herdr skills。每个任务可以配置不同模型，让我的多个订阅真正发挥作用。

### Tab 与自由布局

每个 subagent 都会成为独立 Tab，可以直接查看过程、继续追问，也可以拖动调整布局。这是我最喜欢的功能。

### File 与 Terminal

它支持文件预览和编辑，也保留了 Terminal。Terminal 不再是整个产品，只在需要时出现。

## Paseo 的不足

目前有两个：

1. UI 没有 T3 Code 精致；
2. 我当前使用的版本还不能渲染 Mermaid code block。

但它们都没有影响核心工作流。

## 快速对比

| 工具 | 我最认可的地方 | 对我的主要限制 |
| --- | --- | --- |
| Codex Desktop | GUI 完整、易用 | 资源占用、token 消耗与模型自由度不符合我的需求 |
| Orca | 多 CLI Agent、Remote 与 Mobile 功能完整 | Terminal-first |
| T3 Code | UI 最漂亮 | 暂不支持 Pi |
| Superset | 并行 Agent、worktree、Diff 与 Editor | Terminal-first |
| Pigi | 最直接的 Pi Desktop GUI | 社区与生态还不够成熟 |
| Paseo | 同时支持 Pi、多模型、subagent、Remote、Mobile 和多 Server | UI 仍可改进，当前版本不支持 Mermaid 渲染 |

这些工具都不差，区别只在于你更看重什么。对我来说，决定因素不是功能数量，而是 **Pi、多模型、Mobile 和多个 Server 能否同时成立**。

## 我的结论

- 最看重 UI，并且使用 Claude Code 或 Codex：选 T3 Code；
- 接受 Terminal-first，并重视并行 Agent：看看 Orca；
- 需要 Pi、多模型、subagent、Mobile 和多个 Server：选 Paseo。

当然，Codex Desktop 仍然是门槛最低、体验最好的产品。

如果你接受终端操作，更想自己组合工作台、编辑器和 Agent，可以接着看我[如何用 Pi、Herdr 和 Neovim 组织终端工作流](https://geoqiao.me/blog/terminal-codex-workflow-with-pi-and-herdr/)，按自己的任务选择组件。

## 选择之后

- 想看选择是否真正落地：接着读[我使用 Paseo 一个月后的工作流](https://geoqiao.me/blog/how-i-use-paseo/)，这里记录了多 Agent 分工和手机接续任务的实际用法。
- 多模型支持不等于需要买更多订阅：[AI 编程订阅的额度与成本对比](https://geoqiao.me/blog/ai-coding-subscriptions-api-value-comparison/)单独讨论预算与估算口径，可以和本文的桌面工具选择分开考虑。

## 相关链接

- [Paseo](https://paseo.sh/)
- [Pi Coding Agent](https://github.com/earendil-works/pi)
- [Superset](https://superset.sh/)
- [T3 Code](https://t3.codes/)
- [Orca](https://www.onorca.dev/)
- [相关讨论](https://x.com/geoqiao/status/2086163826249207825)
