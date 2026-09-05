# geoqiao.me

这是站点源码仓库。站点内容来自 GitHub Issues，`config.yaml`、`.github/workflows/pages.yml` 和迁移脚本是源码；GitHub Pages workflow 生成并上传 `output/` artifact。

主要源码：

- GitHub Issues：Blog 与 About 内容源
- `config.yaml`：站点配置
- `.github/workflows/pages.yml`：构建与部署流程
- `scripts/render_slug_redirects.py`：Blog slug 迁移兼容页生成脚本
- `assets/profile/`：头像；Quiet 复用该图片作为 favicon
- `assets/issues/<issue-number>/`：文章附件原件；正文使用固定 commit 的 GitHub 直链
- `assets/charts/`：已有 #62 图表与 CSV，保留原路径
- `content-migrations/`：迁移映射与附件 SHA-256 校验值
- `scripts/prepare_attachment_migration.py`：离线生成附件迁移预览，不写 GitHub

附件上传顺序、备份及部署边界见 [附件维护约定](docs/attachments.md)。

`output/` 只包含本地或 CI 构建生成物，不提交到仓库。旧的根目录 HTML/feed/sitemap/robots、`blog/`、`tag/` 和 `templates/Escape2/` 均为历史生成物，不是源码。
