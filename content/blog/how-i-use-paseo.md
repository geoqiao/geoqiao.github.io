---
issue_number: 67
type: blog
title: Paseo 进阶实战：多 Agent 分工、Profile 配置与手机远程验收流程
slug: how-i-use-paseo
description: 重度使用 Paseo 一个月后的进阶工作流：拆解多 Agent 分栏界面、按职责分档的 Agent Profile 配置、手机远程跟进与验收闭环，以及我配合使用的 Pi 扩展。
created_date: '2026-09-09'
update_date: '2026-09-09'
published_at: '2026-09-08T17:17:48Z'
updated_at: '2026-11-28T08:58:26Z'
tags:
- name: pi
  key: pi
- name: agent-orchestrator
  key: agent-orchestrator
- name: paseo
  key: paseo
---

> 如果你是第一次接触 Paseo，需要 0→1 安装、CLI / Docker 部署或手机扫码配对步骤，建议先看 [Paseo 完整安装与使用教程（2026）](https://geoqiao.me/blog/paseo-guide/)。本文记录我选定它一个月后的日常分工与验收流程。

距离选择 paseo 作为 agent-desktop-app 已经 1 个月了，我再也没有打开过 cursor 或者 codex。

> codex 定义了过去 desktop agent APP 的最佳实践，但是 Paseo 正在定义未来

Paseo 同时拥有：
1. codex desktop 优雅强大的功能设计
2. PI code agent 简洁高效的 harness  & 多 Provider 的兼容
3. Herdr 管理多 agent 的面板
4. 极致丝滑的移动端远程体验

这篇接着[六款桌面 Agent 工具的选择记录](https://geoqiao.me/blog/agent-orchestrator-desktop-selection/)往下写：上一篇解释为什么选 Paseo，这篇记录选定之后怎么用。更早的 [Pi + Herdr + Neovim 终端组合](https://geoqiao.me/blog/terminal-codex-workflow-with-pi-and-herdr/)则是这次迁移的起点。

## Paseo 是什么
### 界面：Codex + Herdr + VSCode

> Paseo = codex  +  Herdr + VSCode

 像在 VSCode 中随意拖动 Multi-agent 的视窗布局，随时打开编辑器阅读代码。并且同时兼具 codex-like 的 agent native UI 风格：

![Paseo 多 Agent 分栏与代码编辑视图](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/20ce35e5a8454335fc196b8d4624b1e76f3f9318/assets/issues/67/0b2278b328a0f6d8.webp)


### Agent Profile：按职责给 Subagent 分工

依托 agent-profile，主会话可以根据任务场景调起不同 subagent 完成任务，即使这些 agent 来自不同的 harness 。

![我的 Paseo Agent profiles 分工配置](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/312ca83c49e997dbdea0d3a24d458061c52d440b/assets/issues/67/30e6643dd97037a2.png)

我按任务职责分档，不是每个任务都要走一遍：主 Agent 负责讨论和把关；查资料交给只读整理，边界清楚的任务交给执行实现，复杂问题交给复杂实现。重要结论再请另一套 harness 下的 Agent 独立复核，减少同一种思路的盲点。


### 其他功能

1. 内置 browser 、完成预览标记修改
2. 支持 39+ agent： Claude code、codex、pi、grok、cursor、Hermes....
3. 非常丝滑从来没有出现过断连的 mobile APP 远程体验

## 我怎么用 Paseo

只需要打开 Settings -> agent -> enable paseo tools , 然后开始任务：

```mermaid
flowchart TD
    accTitle: 我如何使用 Paseo
    accDescr: 明确任务后由主 Agent 执行或委派，我通过手机跟进并在最后验收。
    A["打开项目，启动主 Agent"] --> B["讨论目标、范围和验收标准"]
    B --> C{"是否需要分工？"}
    C -->|否| D["主 Agent 执行"]
    C -->|是| E["读取 Profile，启动合适的子 Agent"]
    D --> F["我用手机查看进度、补充要求或处理授权"]
    E --> F
    F --> G["Agent 完成执行与检查，汇报结果"]
    G --> H{"我验收是否通过？"}
    H -->|需要调整| B
    H -->|通过| I["结束任务"]
```



## 为什么最后留在 Paseo

cursor 和 codex 虽然也很强大，但是没有办法像 Herdr 那样自由布局 Tab 和 panel。Herdr 虽好用，但是对于我这种非 coding 背景的用户来说，还是太难操作了。

Paseo 把 worktree、Herdr/tmux、tailscale 这些技术概念隐藏幕后，同时提供了 codex-like 的友好前端，非常值得一试。


下面是我围绕 Paseo 维护的几个开源扩展（非必须；完整项目介绍见 [pi-tools](https://geoqiao.me/projects/pi-tools/) 与社区插件页 [paseo-stuff](https://geoqiao.me/projects/paseo-stuff/)，其中 `paseo-btw` 与 `pi-usage` 后续已停止维护）：

| 工具        | 用途                                  | 链接                                                                                                                                       |
| --------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| pi-ask    | 支持 RPC 模式，让 Pi 在 Paseo 中使用原生交互式提问。  | [安装](https://pi.dev/packages/@geoqiao/pi-ask?name=pi-ask) · [项目](https://github.com/geoqiao/pi-tools/tree/main/packages/pi-ask)                                      |
| paseo-btw | 类似 Herdr BTW，在 Paseo 中打开独立面板进行旁支对话。 | [安装](https://pi.dev/packages/@geoqiao/paseo-btw?name=paseo-btw) · [项目](https://github.com/geoqiao/pi-tools/tree/main/packages/paseo-btw) |
| pi-usage  | 汇总本机多种 Agent 工具的使用量。                | [安装](https://pi.dev/packages/@geoqiao/pi-usage?name=pi-usage) · [项目](https://github.com/geoqiao/pi-tools/tree/main/packages/pi-usage)    |

## 延伸阅读

- 新手 0→1 上手、安装、Relay 加密中继与排错：[Paseo 完整安装与使用教程](https://geoqiao.me/blog/paseo-guide/)
- 后续演进（2026-11）：如果你更想把多项目收进一个总管 Bot 而不是自己盯多个窗口，可以看 [Orca 怎么用（附 Orca vs Paseo 对比）](https://geoqiao.me/blog/how-i-use-orca/)
