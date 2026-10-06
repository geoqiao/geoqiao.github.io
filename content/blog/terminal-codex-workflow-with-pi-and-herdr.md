---
issue_number: 41
type: blog
title: What's on My Pi Agent?：把 90% 的 Codex Desktop 装进终端
slug: terminal-codex-workflow-with-pi-and-herdr
description: 如果你熟悉终端和 Neovim，想把 Agent、编辑器与并行任务放进同一套工作流，这篇记录了我的 Pi + Herdr 配置分工。读完可以按自己的任务挑选插件，理解代码上下文、Side Chat 和子 Agent 如何配合；它不是开箱即用的 Codex Desktop 替代品。
created_date: '2026-08-01'
update_date: '2026-08-01'
published_at: '2026-08-01T18:50:25Z'
updated_at: '2026-09-10T05:25:53Z'
tags:
- name: ai-agent
  key: ai-agent
- name: herdr
  key: herdr
- name: pi
  key: pi
- name: terminal-workflow
  key: terminal-workflow
---

Codex Desktop 很顺手，只是我的 MacBook M1 PRO 跑不起它。四年没有转过的风扇，只要打开codex 就转不停。

所以我使用pi + Herdr + neovim 打造了一个终端中的 codex desktop

<img width="2032" height="1162" alt="Image" src="https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/c034e81a8451f18d771f8f8c3523d6ad127abf35/assets/issues/41/a6b3e1a9eec7d704.png" />

- **Herdr** 管工作台：workspace、tab、pane、布局、多 Agent 侧边栏。
- **Pi** 管 Agent：模型循环、工具调用、会话、扩展。
- **Neovim** 管代码：浏览、编辑、Buffer，并通过 `pi-nvim` 把上下文喂给 Pi。

Codex Desktop 一手包办的几件事，在这里被拆给了更适合终端的零件。

## Trace

这篇记录的是我在 2026 年 8 月使用的组合，适合已经熟悉终端和 Neovim、愿意自己配置插件的人，不是一份一键安装教程。可以先看工作台、Agent 和编辑器的分工，再按自己的任务挑选后面的插件。

图中的 `prefix+shift+e` 是我绑定布局脚本的快捷键，用来复用或创建 `code` tab、恢复左右各半的 Pi / Neovim 双 pane，不是安装 Herdr 后就自带的配置。插件表现和资源占用的描述也都是我当时的使用经历。

```mermaid
flowchart TD
    A["打开项目"] --> B["切换到 Herdr workspace"]
    B --> C["按 prefix+shift+e"]
    C --> D["恢复 code tab<br/>50:50 布局"]
    D --> P["左侧 pane<br/>Pi"]
    D --> N["右侧 pane<br/>Neovim"]
    B -. "Herdr 侧边栏" .-> S["查看 workspace 与 Agent 状态<br/>idle · working · blocked · done"]
    S --> T["在 pane / tab 间切换长期任务"]
```

### Editor ->  Neovim

右侧 pane 固定放 Neovim，查看、编辑和跳转文件都不用离开终端。需要让 Pi 看代码时，`pi-nvim` 可以把当前文件、选区或整个 Buffer 直接送到左侧会话，不用复制粘贴，也不用切回 VS Code。

### Side Chat -> /btw

`/btw` 为 Pi 提供独立 Side Chat：它会在 Herdr 中打开一个带工具能力的 pane，并继承当前目录、模型和 thinking level。Side Chat 拥有独立上下文，支持连续追问，不会改动主会话；需要时再用 `/btw merge` 把结论合并回来。

### Subagent -> pi-subagents

`pi-subagents` 负责把 research、implementation、review 等任务交给独立的子 Agent。启动时可以选择 `fresh` 或 `fork` 上下文，也可以为每个 Agent 指定模型和 thinking level，或者让它们在后台并行工作。配合 Herdr skills，还能像在 Codex Desktop 里一样，打开某个 Subagent 的 pane，直接查看它的对话和进度。

### Goal -> pi-goal

`pi-goal` 让 Pi 可以围绕一个目标持续工作，而不是每完成一轮就停下来等下一条提示。任务受阻时会进入 `blocked`；我也可以随时 `/goal pause`，之后再用 `/goal resume` 从原来的目标继续。

### Web-search & Computer-use

`pi-web-access` 负责搜索和读取网页，也能处理 GitHub、PDF 和视频内容；`pi-computer-use` 负责观察并操作桌面界面，包括定位窗口、点击、输入和滚动。一个解决“找到信息”，另一个解决“替我操作”。

### Compaction -> pi-codex-compaction

`pi-codex-compaction` 在使用 OpenAI Codex 模型时，把原生的上下文压缩能力接进 Pi。Pi 自带的 compaction 在超长任务里经常还是会撞上上下文上限；换成 Codex 的原生 compaction 后，长会话可以继续压缩和恢复，token 也更耐用。

## PROS & CONS

优点很直接：

- 风扇不转了。
- token 更耐用了。
- 以上所有配置都可以让 AI 完成。

缺点也很明显：

- 无法开箱即用，终端操作和 Neovim 都有使用门槛。
- 浏览器和 Computer Use 还比较粗糙，窗口失焦之类的问题也没有完全解决。

这并不适合想要开箱即用的人。虽然 AI 可以帮忙解决 99% 的配置问题，但日常操作仍然需要适应，与 Desktop App 还有差距。

如果你更想用 GUI 管理任务，或需要在手机上接管，可以接着看我[如何按 Pi、多模型和远程需求选择桌面 Agent 管理工具](https://geoqiao.me/blog/agent-orchestrator-desktop-selection/)。

## 接下来读什么

- 想知道这套终端组合后来如何迁到 GUI：读[我使用 Paseo 一个月后的工作流](https://geoqiao.me/blog/how-i-use-paseo/)，看多 Agent 分工和手机接续任务怎样落地。
- 准备给不同任务分配模型：先看[AI 编程订阅的额度与成本对比](https://geoqiao.me/blog/ai-coding-subscriptions-api-value-comparison/)，区分满额估算和自己的实际用量，再决定是否增加订阅。

## 软件与插件链接

| 名称                    | 在这套系统中的用途                | 地址                                                      |
| --------------------- | ------------------------ | ------------------------------------------------------- |
| Pi                    | Agent runtime            | [GitHub](https://github.com/earendil-works/pi)          |
| Herdr                 | Workspace、布局和多 Agent TUI | [GitHub](https://github.com/ogulcancelik/herdr)         |
| Neovim                | 编辑器                      | [官网](https://neovim.io/)                                |
| `pi-nvim`             | 将 Neovim 上下文发送给 Pi       | [GitHub](https://github.com/carderne/pi-nvim)           |
| `pi-web-access`       | 搜索并读取网页内容                | [GitHub](https://github.com/nicobailon/pi-web-access)   |
| `pi-subagents`        | 任务级 Subagent             | [GitHub](https://github.com/nicobailon/pi-subagents)    |
| `pi-herdr-btw`        | 独立 Side Chat             | [GitHub](https://github.com/oscabriel/pi-herdr-btw)     |
| `pi-goal`             | Goal、continuation 与恢复    | [GitHub](https://github.com/kky42/pi-goal)              |
| `pi-codex-compaction` | 接入 Codex 原生 compaction   | [GitHub](https://github.com/ogulcancelik/pi-extensions) |
| `pi-computer-use`     | 操作桌面应用                   | [GitHub](https://github.com/injaneity/pi-computer-use)  |
| `pi-mcp-adapter`      | 接入 MCP 服务                | [GitHub](https://github.com/nicobailon/pi-mcp-adapter)  |
