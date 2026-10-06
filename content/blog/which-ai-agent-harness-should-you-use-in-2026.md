---
issue_number: 74
type: blog
title: Which AI Agent Harness Should You Use in 2026
slug: which-ai-agent-harness-should-you-use-in-2026
description: 综合 Databricks、FrontierHarness、HarnessRank、Mercury、Composio 与我的 escaping 实测，从完成率、成本和 Pareto 前沿比较 Pi、Codex、Claude Code 等 Harness，给出 2026 年的选型建议。
created_date: '2026-09-13'
update_date: '2026-09-13'
published_at: '2026-09-13T14:32:08Z'
updated_at: '2026-09-13T17:11:06Z'
tags:
- name: ai-agent
  key: ai-agent
- name: pi
  key: pi
---

> 当阳光亲吻你的沃土、狂风吹刮你的橡树，Pi 永远和你一起跳动

## 结论

1. **Pi：默认首选，多项评测兼顾完成度与成本。**
2. **Codex：同样值得优先选，多项评测表现靠前。**
3. **Claude Code：使用 Claude模型时，优先保留原生。**
4. **DeepSeek Harness（DSH）：低预算候选，Native 完成度高于 PTC。**

跨应用任务也值得试 **Oh My Pi（完成度优先）、Hermes（成本优先）**；Kimi Code 也有高分表现。**Exo、CritiqueCode** 完成率偏低，**OpenCode、Grok Build** 暂不优先。

下文统一看**完成度最高、成本最低、Pareto 最优**。前沿名单按完成率从高到低排列，**进入前沿不等于值得推荐**。图中越靠左上越好；红点是前沿配置，灰点是其他配置，红色虚线连接前沿。

## 评测数据

> 本文结论限于所列评测的任务、模型与配置，各图独立比较，不合并为通用排名。资料核对截至 2026-09-13。

### 1. Databricks

- **完成度最高：Pi + Opus 4.8 xhigh。**
- **成本最低：Codex + GPT-5.4 mini。**
- **Pareto 最优：**Pi（Opus 4.8 xhigh）→ Claude Code（Opus 4.8 high）→ Pi（GLM 5.2、Opus 4.8 high、GPT-5.5 medium）→ Codex（GPT-5.4 medium、mini），对应原图红点。

![Databricks 原图：模型与 harness 组合的任务成本和完成表现](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/2716e271eb7a86ade616ba4bb0e237bd454709e4/assets/issues/73/aa0e2e6f2ff80458.png)

*方法：[Databricks](https://www.databricks.com/blog/benchmarking-coding-agents-databricks-multi-million-line-codebase) 内部 PR 任务，交叉比较模型、harness 与推理强度，以隐藏测试验收；本节按原图识别最优配置。*

### 2. FrontierHarness

- **完成度最高：Codex，66.7%（20/30），$2.31/题。**
- **成本最低：Exo，$0.56/题，完成率 53.3%（16/30）。**
- **Pareto 最优：Codex → Pi → Exo。** 优先选 Codex 或 Pi；后者为 **60%（18/30），$1.46/题**。前沿按成本完整组计算。

![FrontierHarness：成本完整组的观测前沿为 Codex、Pi、Exo](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/0102718e9abc0989757df30b322756bd3bd3cb4e/assets/issues/74/47f2ecba7d72beb1.png)

*方法：[FrontierHarness](https://frontierharness.org/) 固定 Kimi K3，21 道 Terminal-Bench + 9 道 DeepSWE、每组合每题一次，按[数据](https://github.com/frontier-harness-eval/eval/blob/e837a70bd6beb4e72eeeda62dd06e3bd34f6cb63/results/eval-data.json)重算平均每题成本；空心点为 7 组缺失费用的成本下限。*

### 3. HarnessRank

- **完成度最高：Pi，76.0%。**
- **成本最低：Pi，$0.345/题。** Codex 为 71.2%、$0.688/题，约是 Pi 的两倍成本。
- **Pareto 最优：只有 Pi。** 它同时优于另外三个配置的均值。

![HarnessRank：Pi 是均值上的唯一非劣点](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/0102718e9abc0989757df30b322756bd3bd3cb4e/assets/issues/74/a00dcb9336028a0f.png)

*方法：[HarnessRank](https://harnessrank.net/) 固定 GPT-5.5 medium，在 Terminal-Bench 2.1 的 89 题上重复 3–5 轮，[数据](https://harnessrank.net/data/runs.js)取均值。*

### 4. Mercury V2

- **完成度最高：DSH 与 Oh My Pi，都是 100%（20/20）。** 成本分别为 $0.052、$0.062/题。
- **成本最低：CritiqueCode，约 $0.0033/题（标价估算），完成率 65%（13/20）。**
- **Pareto 最优：DSH → Pi → CritiqueCode。** 完成度优先选 DSH；Pi 以更低费用达到 **95%（19/20）、$0.033/题**。

![Mercury V2：报告值与估算值分开标记，Codex 成本未知](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/0102718e9abc0989757df30b322756bd3bd3cb4e/assets/issues/74/227f61fe7e096b1c.png)

*方法：[Mercury V2](https://www.critique.sh/blog/mercury-harness-study-v2) 固定 GLM-5.3-Flash，20 道 FeatBench、每题一次，CPU 随任务配置、7 个结果经补丁复验；[数据](https://github.com/repath500/mercury-harness-benchmark/blob/868e1e2f2ba8660e583d42de706bfc08267a9e87/benchmarks/mercury_v2/charts/data/summary.json)含费用估算，Codex 的异常零账本记为成本未知。*

### 5. 我的 escaping 测试

- **完成度最高：Pi + GPT-6 Astra，100%（20/20）。** CM off / remote 两组都完成，估算成本分别为 **$8.35 / $8.42**。
- **成本最低：DSH PTC + DeepSeek Flash，$0.25，确认完成 80%（16/20），另有 1 项未验证。**
- **Pareto 最优：Pi + Astra（CM off）→ Pi + DeepSeek Flash → DSH Native → DSH PTC。** 分别对应 **100% / 95% / 90% / 80%**，估算成本 **$8.35 / $0.45 / $0.35 / $0.25**。

![escaping：十个配置的完整开发成本与 20 项需求完成度](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/0102718e9abc0989757df30b322756bd3bd3cb4e/assets/issues/74/f99c7060ffccaf3c.png)

*方法：escaping R2 十个配置各开发一次博客主题，模型为 GPT-6 Astra / Opus 5 / DeepSeek Flash（high），首次交付后按 20 项需求验收；费用为整次开发的 API 等价估算，DeepSeek 取高峰价，CM 指 Context Management。*

### 6. Composio · DeepSeek V4 Pro

- **完成度最高：Pi，70%（21/30）。** Codex 与 DSH 均为 66.7%（20/30）。
- **成本最低：DSH，$0.028/共同成功任务。** Pi 与 Codex 都是 $0.031。
- **Pareto 最优：Pi → DSH（原表两列的图示前沿）。** Pi 完成更多，DSH 成本更低。

![Composio：全30题完成率与共同成功任务成本，按原表报告值绘图](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/0102718e9abc0989757df30b322756bd3bd3cb4e/assets/issues/74/910f532bf1a45fb9.png)

*方法：[Composio](https://composio.dev/content/pi-agent-vs-codex) 固定 DeepSeek V4 Pro（0813，max reasoning），运行 30 道真实应用/MCP 任务；横轴为共同成功子集成本，非全任务均摊成本。*

### 7. Composio · Kimi K3

- **完成度最高：Oh My Pi，88%（22/25）。** Kimi Code 84%，Pi 72%，Codex 68%。
- **成本最低：Hermes，$0.46/成功任务（估算），完成率 80%（20/25）。**
- **Pareto 最优：Oh My Pi → Hermes（按原表口径）。** Oh My Pi 的每成功任务成本为 $0.52，完成度与成本均优于其余六组。

![Composio Kimi K3：25题完成率与共有24题的估算每成功任务成本](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/0102718e9abc0989757df30b322756bd3bd3cb4e/assets/issues/74/8f849a03d36d9d00.png)

*方法：[Composio 八种 Harness 评测](https://composio.dev/content/best-ai-agent-harnesses) 固定 Kimi K3（OpenRouter，max）、跨应用/MCP任务；剔除5个无效任务后各25次有效评分，异常尝试替换，费用按共有24题及7月30日标价估算。*

## 最后怎么选

无论什么模型、什么场景，Pi 也是不是最优选，但是永远是最可靠的那个
