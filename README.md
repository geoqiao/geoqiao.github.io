# geoqiao.me

The site uses **[Geo](theme/README.md)**, an independent local theme owned by this repository. Quiet was its starting point; Geo does not track future Quiet changes. Quiet remains escaping's default theme. Build and preview locally with `bash scripts/preview_geo.sh`, then open <http://localhost:8765>.

这是站点源码仓库。站点内容来自 GitHub Issues，`config.yaml`、`.github/workflows/pages.yml` 和迁移脚本是源码；GitHub Pages workflow 生成并上传 `output/` artifact。

主要源码：

- GitHub Issues：Blog 与 About 内容源
- `config.yaml`：站点配置
- `config.yaml` 的 `projects:`、`theme/projects/`：项目目录与独立产品首页；`config.yaml` 的 `pages.extra` 为每个项目开出 `/projects/<slug>/`
- `.github/workflows/pages.yml`：构建与部署流程
- `assets/profile/`：头像原件；Geo 使用 `theme/static/images/avatar.png` 的本地副本作为头像与 favicon
- `assets/social/`：全站分享图；`seo.social_image` 引用固定 commit 直链，维护步骤见[图片说明](assets/social/README.md)
- `assets/issues/<issue-number>/`：文章附件原件；正文使用固定 commit 的 GitHub 直链
- `assets/charts/`：已有 #62 图表与 CSV，保留原路径
- `content-migrations/`：附件迁移映射与 SHA-256 校验值
- `scripts/prepare_attachment_migration.py`：离线生成附件迁移预览，不写 GitHub

附件上传顺序、备份及部署边界见 [附件维护约定](docs/attachments.md)。

`output/` 只包含本地或 CI 构建生成物，不提交到仓库。旧的根目录 HTML/feed/sitemap/robots、`blog/`、`tag/` 和 `templates/Escape2/` 均为历史生成物，不是源码。

## 本站博客发布规范

escaping 的通用契约允许省略部分元数据，但本站博客必须显式填写 `slug`、`description`、`created_date`。
`slug` 使用表达文章主题的英文单词，以连字符分隔，可含年份；正式地址为 `/blog/{slug}/`，不使用 Issue 编号或纯数字占位。`description` 是简洁的内容摘要，`created_date` 是带引号的真实原始创作日期。
标题使用 Issue 原生标题，类型/标签/发布状态使用 GitHub labels；Issue body 的 front matter 仅保留上述三项。

既有文章通常保持地址不变。作者明确授权纠正错误地址时，先在 `config.yaml` 的 `redirects` 增加旧地址到新地址的一行，再修改最新远端 Issue 的 slug；不从本地历史稿覆盖正文。escaping 为每个旧地址生成带 canonical 和即时跳转的页面；旧地址仍是文章页时，文章页优先，跳转页暂不生成（构建给出 `REDIRECT_LEFT_OUT` 警告）。
修改后核验新页、旧址跳转、首页、Atom、sitemap 和评论的原 Issue 绑定；不得因改地址新建 Issue、重置日期或搬动附件。

同一篇文章再次改名时，保留原来那行，并追加当前地址到新地址的一行。escaping 沿着这些行找到仍存在的文章页，让所有旧地址直接跳到最新地址，不依赖顺序；循环或重复的旧地址会让构建失败。

## 内容变更与撤稿

工作流监听 Issue 的创建、编辑、标签变更、关闭、重开、删除与转移。
`deleted`、`transferred` 是 GitHub 支持的 [`issues` 事件类型](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues)，不是需要创建的标签；这类事件要求工作流文件位于默认分支。

移除 `published` 才是常规撤稿操作，仅关闭 Issue 不会撤稿。撤稿、删除或转移时，一并处理 `theme.options.featured_posts`、指向该文的正文内链和 `redirects` 里指向它的行；未处理的引用可能阻止构建。只有构建、校验和部署全部成功后，线上内容才更新；不要删除校验来绕过失败。

## 构建与升级

工作流的 `uses: geoqiao/escaping@<完整 commit SHA> # vX.Y.Z` 是生成器版本的唯一固定值，不跟随移动分支；升级时改为新版本 tag 对应的完整 commit SHA。
escaping Action 用自身 lock 在 runner temp 安装 Python 3.14 环境并构建，站点不再自行安装编译器。

| 环节 | 约定 |
| --- | --- |
| 测试 | 站点 unittest 在构建前运行：`uv run --no-project --python 3.14 --with pyyaml==6.0.3` |
| 构建 | `geoqiao/escaping` Action 读取根目录 `config.yaml`，生成并校验整站（含 `/projects/<slug>/` 和 `redirects` 的旧地址页）后输出到 `output/` |
| 发布 | 分支可以构建，只有 main 的成功 build 可以部署；有 Issue 被跳过时部署照常进行，随后工作流标红并列出这些 Issue |

本地预览与检查见 [Geo 主题说明](theme/README.md)。

升级前保留当前 Config、workflow、生成器身份和成功的 Pages artifact。
先推分支检查安装、构建和完整产物，再合入 main；上线后检查页面、旧链接、feed、
sitemap 和静态资源。构建成功不代替线上检查。

回滚通过新 revert commit 成套恢复已验证的 Config、workflow 与生成器版本，
不能只回退 pin。先核对期间的代码和 Issue 变化，以及当前内容对旧编译器的兼容性；
代码回滚不会撤销 Issue 编辑。保留成功产物，不覆盖期间的新内容。
