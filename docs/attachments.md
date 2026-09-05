# 附件维护约定

附件原件属于本站仓库，正文仍以 GitHub Issue 为唯一来源。本站选择固定 commit 的
GitHub 直链：不引入图床、不在生产构建时下载图片、不改写博客或 Atom 中的附件 URL。
访客需要能够访问 GitHub 的资源域名；Pages 的成功构建不代表外链可访问。

## 文件职责

| 位置 | 内容 |
| --- | --- |
| `assets/profile/avatar.png` | 当前 GitHub 头像的 256px PNG 快照；Quiet 同时用于左上角、About 和 favicon |
| `assets/issues/<issue-number>/<content-hash>.<ext>` | 文章附件原件；按不可变 Issue 编号归档，不跟随标题或 slug 改名 |
| `assets/charts/` | #62 已发布图表与 CSV；无需为了目录整齐再迁移 |
| `content-migrations/attachments-2026-09.json` | 本次旧 URL、文件路径、固定 commit、SHA-256 与字节数 |
| `.scratch/attachment-migration-2026-09-05/` | 本地完整 Issue/评论快照、迁移预览；不提交、不作为第二内容源 |
| `output/` | 编译器生成物，不提交；本方案不复制 `assets/` 到这里 |

新附件文件名建议取 SHA-256 前 16 位。相同文件名必须对应相同原始字节；发现碰撞就
增加摘要长度，不能覆盖。大视频、大型压缩包不适合普通 Git；需要时再另行选择托管，
不要默认引入 Git LFS。

## 上传顺序

1. 获取/创建 Issue 编号（新文章保持草稿），保存附件到对应目录。
2. 提交并 push 附件，取得完整 40 位 commit SHA。附件原件不压缩重编码。
3. 检查公开 URL 可访问，下载字节与原文件 SHA-256 一致，再在正文引用。
4. 编辑 Issue 或站点 Config 后，现有 Pages workflow 构建并上传完整 artifact；
   仅 `main` 可部署。单独修改附件无需重建，不在 workflow 中增加 `assets/**` 触发器。

图片和直接下载链接：

```markdown
![说明](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/<full-sha>/assets/issues/<number>/<hash>.png)
[下载 CSV](https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/<full-sha>/assets/issues/<number>/<hash>.csv)
```

需要 GitHub 文件预览时使用 `https://github.com/geoqiao/geoqiao.github.io/blob/<full-sha>/<path>`。
不要使用 `main`、临时签名 URL，或在 Issue 中写 `/assets/...` 相对路径。
GitHub 官方说明：[永久文件链接](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files)。

更新附件时新增文件及 commit，再显式更新对应正文/Config 链接；保留旧版本。
合并包含附件的分支时保留原始 commit（不能只 squash 后删除唯一的分支引用），
确保已引用的 commit 仍可达。必要时保留独立的附件分支或标签。

## 本次历史迁移

基线为 37 个 Issue（36 篇 Blog、1 篇 About），6 篇文章包含 12 张旧附件图片。
#62 已使用固定 commit URL，正文和 `assets/charts/` 不改。

备份 `issues-before.json` 使用 GitHub API 的 `state=all` 分页完整响应；
`comments-before.json` 使用仓库 Issue comments API 的全部分页响应。
两者保存在上表的本地备份目录，请在写回前另存到个人备份盘。

离线预览（输出目录必须不存在，避免覆盖上次结果）：

```bash
python3 scripts/prepare_attachment_migration.py \
  --backup .scratch/attachment-migration-2026-09-05/issues-before.json \
  --map content-migrations/attachments-2026-09.json \
  --output .scratch/attachment-migration-2026-09-05/preview
python3 -m unittest discover -s tests -v
```

工具验证工作树文件与固定 commit 的字节、摘要和大小，且旧图片引用恰好出现一次，
然后输出 6 份建议正文、`changes.diff` 和前后正文校验值。它没有网络写入或 apply 模式，
也不是通用 Markdown 解析器；未登记的附件、新文章或不同 HTML 格式必须重新审视。

写回前必须单独确认生产操作，因为 Issue 编辑会触发当前 `main` workflow：

- 先让附件 commit 在远端可访问，并完成真实站点构建和预览。
- 再次读取每个目标 Issue，确认正文与备份完全一致；有任何新编辑则停止并重新准备。
- 分批只 PATCH `body`，不要重建 Issue、改标题/slug/标签/状态或删除评论。
- 每次写入后读回核对全文及其他字段，记录完成清单；失败就停止，不继续批量写入。
- 最后对比 37 个 Issue 和全部评论，确认差异仅是登记的 12 个 URL，以及 GitHub
  自动更新的 `updated_at`。原始创建时间、正文 `created_date` 不变；Atom 更新日期会变。

若需回滚，仅在远端正文仍等于本次写入结果时恢复备份正文，防止覆盖后续编辑。
不要删除原附件或旧 GitHub 上传；退回编译器 pin 不会撤销已经修改的 Issue 正文。
