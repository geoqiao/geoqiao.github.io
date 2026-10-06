---
issue_number: 62
type: blog
title: 2026 AI 编程订阅对比：Codex、Claude Code、Kimi 怎么选？
slug: ai-coding-subscriptions-api-value-comparison
description: 2026 AI 编程订阅怎么选，哪个更划算？对比 Codex、Claude Code、Cursor、Kimi 等主流套餐的月费、Token 额度、每百万 Token 成本和 API 等价倍率，并以 DeepSeek API 价格为参照，结合模型能力与满额使用条件，判断是否值得订阅或升级。
created_date: '2026-09-05'
update_date: '2026-09-05'
published_at: '2026-09-05T09:07:55Z'
updated_at: '2026-09-10T05:25:57Z'
tags:
- name: ai-agent
  key: ai-agent
- name: ai-workflow
  key: ai-workflow
---

**按仓库满额估算，ChatGPT Pro 20× 的 GPT 5.6 Sol 仅 $0.01623 / 百万 tokens，比 Kimi ¥199 档便宜约 36%、比 DeepSeek V4 Pro 闲时 API 便宜约 62%；同档 Luna 更低至 $0.00083，仅为 DeepSeek V4 Flash 闲时 API 单价的约 1/17。**

数据与图表全部来自 [Real API Pricing][repo]，快照日期 **2026-09-06**。

[下载完整数据 CSV](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/b88732f19bf0fb40f88fcbd823108de000272284/assets/charts/issue-62-fbac563730fb1e89.csv)（上游原始快照；倍率按文中公式计算）。

## 主要套餐

**实际混合单价 = 月费 ÷ 月可用 token 数。** 每月按四周跑满计算，包含输入、输出和缓存；同套餐不同模型的额度不能相加。

**API 等价倍率 = 同模型 API 混合标价 ÷ 订阅实际混合单价**，按仓库 `list_blended_usd_per_mtok / real_usd_per_mtok` 计算，保留一位小数。10× 表示跑满后的同量 token 按 API 标价计约值月费的 10 倍，不是可提现余额，也不是套餐名称中的 5× / 20×。

| 套餐 × 模型 | 月费（美元） | 月额度（亿 tokens） | 美元 / 百万 tokens | API 等价倍率 |
| --- | ---: | ---: | ---: | ---: |
| ChatGPT Plus × GPT 5.6 Sol | 20 | 6.16 | 0.03247 | 16.9× |
| ChatGPT Pro 5× × GPT 5.6 Sol | 100 | 30.80 | 0.03247 | 16.9× |
| ChatGPT Pro 20× × GPT 5.6 Sol | 200 | 123.20 | 0.01623 | 33.7× |
| ChatGPT Plus × GPT 5.6 Luna | 20 | 120.101 | 0.00167 | 16.8× |
| ChatGPT Pro 20× × GPT 5.6 Luna | 200 | 2402.026 | 0.00083 | 33.9× |
| Claude Max 5× × Opus 5（9/14+） | 100 | 78.50 | 0.01274 | 53.7× |
| Claude Max 20× × Opus 5（9/14+） | 200 | 157.00 | 0.01274 | 53.7× |
| Kimi 会员 ¥99 × Kimi K3 | 14.60 | 2.32 | 0.06295 | 6.5× |
| Kimi 会员 ¥199 × Kimi K3 | 29.36 | 11.61 | 0.02529 | 16.2× |
| Kimi 会员 ¥699 × Kimi K3 | 103.12 | 34.83 | 0.02961 | 13.9× |

来源：[计算主表][points]。人民币按仓库汇率 1 USD = 6.7787 CNY 换算。

- **Codex：** Sol 的 Pro 20× 单价约为 Plus 的一半；Luna 由 Sol 基准和扣费比例推算，不是独立跑满实测。低单价不等于免费：Pro 20× 仍需 $200/月。
- **Claude：** Opus 5 满额估值比 Kimi ¥199 档便宜约 **50%**；但采用 **9/14+** 混合样本归一口径，不是 9 月 6 日已生效的纯 Opus 5 实测。
- **Kimi：** 三档中 ¥199 单位成本最低；基准是以 K3-256K 为主的混合负载，其他档位按比例推算，不代表纯 K3 1M 额度。

## Cursor、Grok 与其他主流订阅

| 套餐 × 模型 | 月费（美元） | 月额度（亿 tokens） | 美元 / 百万 tokens | API 等价倍率 | 条件 |
| --- | ---: | ---: | ---: | ---: | --- |
| Cursor Pro × Grok 4.6 | 20 | 4.70 | 0.04255 | 13.0× | 面板样本 |
| Cursor Pro+ × Grok 4.6 | 60 | 17.12 | 0.03505 | 15.7× | 跨档推算 |
| Cursor Ultra × Grok 4.6 | 200 | 64.20 | 0.03115 | 17.7× | 标准模式估算，有促销混杂 |
| Cursor Ultra Fast × Grok 4.6 | 200 | 30.30 | 0.06601 | 8.4× | Fast 样本，有促销混杂 |
| Cursor Pro × Composer 2.5 Standard | 20 | 12.087 | 0.01655 | 13.0× | 按扣费比例推算 |
| Cursor Pro × Composer 2.5 Fast | 20 | 4.285 | 0.04667 | 4.6× | 默认 Fast 模式推算 |
| SuperGrok × Grok 4.6 | 30 | 5.09 | 0.05894 | 9.4× | 非双倍周实测 |
| SuperGrok Plus × Grok 4.6 | 100 | 20.40 | 0.04902 | 11.3× | 周池换算 |
| SuperGrok Heavy × Grok 4.6 | 300 | 50.90 | 0.05894 | 9.4× | 周池换算 |
| GLM Coding Pro 新客 × GLM 5.3 | 79.37 | 17.40 | 0.04561 | 6.6× | 95% 缓存场景 |
| GLM Coding Pro 新客 × GLM 5.3 Flash | 79.37 | 52.64 | 0.01508 | 2.3× | 95% 缓存场景 |
| GLM Coding Pro 老客 × GLM 5.3 Flash | 21.98 | 52.64 | 0.00418 | 8.2× | 老客价、95% 缓存场景 |
| MiniMax Token Plan Max 国内版 × MiniMax M3 | 17.55 | 18.00 | 0.00975 | 7.1× | 官方额度 |
| MiniMax Token Plan Max 国际版 × MiniMax M3 | 55 | 51.00 | 0.01078 | 6.4× | 官方额度 |
| OpenCode Go × DeepSeek V4 Flash | 10 | 21.548 | 0.00464 | 6.0× | 闲时、共享池及模型子额度 |
| OpenCode Go × Qwen3.7 Plus | 10 | 11.255 | 0.00888 | 10.4× | ≤256K、共享池换算 |
| 阿里云百炼 Coding Plan Pro × Qwen3.7 Plus | 29.50 | 1.98 | 0.14901 | 0.6× | 原样本档位不明，按 ¥200 Pro 推算 |

**同样用 Grok 4.6，Cursor Ultra 标准模式的满额估值比 SuperGrok 便宜约 47%；但开 Fast 后，单价反而更高。** 模型名相同，也要看渠道和模式。

倍率以各模型自身标价为基准，不宜跨模型直接排优劣；DeepSeek 使用仓库常规标价基准，非闲时价，因此 OpenCode Go 的 6.0× 若改与闲时 API 比则约为 3.0×。低于 1× 表示该口径下订阅比 API 标价更贵。

来源：[计算主表][points]。表中覆盖仓库收录的主要订阅品牌；Copilot、Windsurf、TRAE 等未进入该版本采用主表，不沿用旧文数据补数。

## DeepSeek API：比较基准列清楚

| 模型 × 时段 | 美元 / 百万 tokens |
| --- | ---: |
| DeepSeek V4 Pro API 闲时 | 0.04274 |
| DeepSeek V4 Pro API 忙时 | 0.08549 |
| DeepSeek V4 Flash API 闲时 | 0.01392 |
| DeepSeek V4 Flash API 忙时 | 0.02785 |

来源：[计算主表][points]，API 按仓库高缓存 token mix 折算，并非纯输入或输出标价。**Sol 比 V4 Pro 闲时便宜，但仍比 V4 Flash 闲时贵约 17%**，不能笼统写成“比所有 DeepSeek 都便宜”。订阅则需跑满才能达到表中单价。

![实际混合单价总览](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/b88732f19bf0fb40f88fcbd823108de000272284/assets/charts/issue-62-317a19dbd62e9505.png)

## 单价之外，看模型能力

![Agent Arena 能力与价格对比](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/b88732f19bf0fb40f88fcbd823108de000272284/assets/charts/issue-62-eaeb0492b8b4eabb.png)

**越靠右越便宜，越靠上分数越高。** 连线是订阅帕累托前沿：在这张榜上，没有另一组合同时更便宜且分数不低。缺分模型不入图，不同榜单不能混算。[全部图表][charts]

**重度使用看 Sol、Opus 的满额成本，低价批量任务看 Luna、GLM Flash、DeepSeek Flash；用 Cursor 则把 Standard 和 Fast 分开算。** 用不完额度，就不要为了满额单价升级。

## 选好订阅之后

额度与单价只回答预算问题，工作台和任务组织还需要另外选择：

- 熟悉终端、愿意自己组合工具：看 [What's on My Pi Agent](https://geoqiao.me/blog/terminal-codex-workflow-with-pi-and-herdr/)，了解 Pi、Herdr 与 Neovim 的分工。
- 更看重 GUI 和手机接管：看[六款桌面 Agent 管理工具的试用取舍](https://geoqiao.me/blog/agent-orchestrator-desktop-selection/)，按自己的需求选入口。
- 想先减少无效消耗，而不是升级套餐：看[给策略分析师的 AI 协作指南](https://geoqiao.me/blog/superpowers-claude-code-guide-for-strategy-analysts/)，其中讨论了查询落盘、分阶段交付与验证。

## 参考资料

[Real API Pricing][repo] · [完整数据与逐行备注][points] · [来源与许可][sources]。固定版本 `7f7ce49`；本文摘录并重排数据，未独立复测上游样本。

部分历史数据源自 Awesome Coding Plan（mahonzhan@gmail.com，CC BY 4.0），经仓库归一、推算；署名与许可链接见[来源说明][sources]。

[repo]: https://github.com/FeiZhuLulu/real-api-pricing/tree/7f7ce49757d0d6486d576fadb460c32150aeab5a
[points]: https://github.com/FeiZhuLulu/real-api-pricing/blob/7f7ce49757d0d6486d576fadb460c32150aeab5a/derived/points.csv
[charts]: https://github.com/FeiZhuLulu/real-api-pricing/blob/7f7ce49757d0d6486d576fadb460c32150aeab5a/charts/README.md
[sources]: https://github.com/FeiZhuLulu/real-api-pricing/blob/7f7ce49757d0d6486d576fadb460c32150aeab5a/SOURCES.md
