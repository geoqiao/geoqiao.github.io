# geoqiao.me

The site uses **[Geo](theme/README.md)**, an independent local theme owned by this repository. Quiet was its starting point; Geo does not track future Quiet changes. Quiet remains escaping's default theme. Build and preview locally with `bash scripts/preview_geo.sh`, then open <http://localhost:8765>.

这是站点源码仓库。站点内容来自 GitHub Issues，`config.yaml`、`.github/workflows/pages.yml` 和迁移脚本是源码；GitHub Pages workflow 生成并上传 `output/` artifact。

主要源码：

- GitHub Issues：Blog 与 About 内容源
- `config.yaml`：站点配置
- `theme/projects.yaml`、`theme/projects/`：Geo 项目目录与独立产品首页
- `theme/build.py`：本站构建入口，复用固定版本 escaping 的编译、路由、校验与暂存发布
- `.github/workflows/pages.yml`：构建与部署流程
- `scripts/render_slug_redirects.py`：Blog slug 迁移兼容页生成脚本
- `assets/profile/`：头像原件；Geo 使用 `theme/static/images/avatar.png` 的本地副本作为头像与 favicon
- `assets/social/`：全站分享图；`seo.social_image` 引用固定 commit 直链，维护步骤见[图片说明](assets/social/README.md)
- `assets/issues/<issue-number>/`：文章附件原件；正文使用固定 commit 的 GitHub 直链
- `assets/charts/`：已有 #62 图表与 CSV，保留原路径
- `content-migrations/`：迁移映射与附件 SHA-256 校验值
- `scripts/prepare_attachment_migration.py`：离线生成附件迁移预览，不写 GitHub

附件上传顺序、备份及部署边界见 [附件维护约定](docs/attachments.md)。

`output/` 只包含本地或 CI 构建生成物，不提交到仓库。旧的根目录 HTML/feed/sitemap/robots、`blog/`、`tag/` 和 `templates/Escape2/` 均为历史生成物，不是源码。

## 本站博客发布规范

escaping 的通用契约允许省略部分元数据，但本站博客必须显式填写 `slug`、`description`、`created_date`。
`slug` 使用表达文章主题的英文单词，以连字符分隔，可含年份；正式地址为 `/blog/{slug}/`，不使用 Issue 编号或纯数字占位。`description` 是简洁的内容摘要，`created_date` 是带引号的真实原始创作日期。
标题使用 Issue 原生标题，类型/标签/发布状态使用 GitHub labels；Issue body 的 front matter 仅保留上述三项。

既有文章通常保持地址不变。作者明确授权纠正错误地址时，先在 `content-migrations/blog-slugs-2026-08.json` 增加旧地址到新 slug 的映射，再修改最新远端 Issue 的 slug；不从本地历史稿覆盖正文。该映射在切换前保留旧文章，切换后生成带 canonical 和即时跳转的兼容页。
修改后核验新页、旧址跳转、首页、Atom、sitemap 和评论的原 Issue 绑定；不得因改地址新建 Issue、重置日期或搬动附件。

同一篇文章再次改名时，保留原映射并追加当前地址到新地址的映射。脚本按迁移链寻找仍存在的文章页：切换前保留当前正文，切换后让所有旧地址直接跳到最新地址，不依赖映射顺序。循环映射会在写入前失败；多个正文页同时存在、路径越界及产物被覆盖仍会失败。

## 内容变更与撤稿

工作流监听 Issue 的创建、编辑、标签变更、关闭、重开、删除与转移。
`deleted`、`transferred` 是 GitHub 支持的 [`issues` 事件类型](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues)，不是需要创建的标签；这类事件要求工作流文件位于默认分支。

移除 `published` 才是常规撤稿操作，仅关闭 Issue 不会撤稿。撤稿、删除或转移时，一并处理 `site.featured_posts`、指向该文的正文内链和相关 `content-migrations` 映射；未处理的引用可能阻止构建。只有构建、校验和部署全部成功后，线上内容才更新；不要删除校验来绕过失败。

## 构建与升级

工作流的 `ESCAPING_SHA` 是生成器版本的唯一固定值，不跟随移动分支。
运行时统一使用 Python 3.14.x；Actions summary 记录实际安装身份。

| 环节 | 约定 |
| --- | --- |
| 安装 | 干净、精确 SHA 的 compiler checkout，调用其 `starter/.github/scripts/install.sh`，按 lock 和 build group 安装为 noneditable 包 |
| 环境 | 虚拟环境及 cache 位于 runner temp，不写进 compiler source；测试和构建均使用安装环境的 Python |
| 配置 | 根目录 `config.yaml` 显式提供仓库与站点 URL；输出仍为根目录 `output/` |
| 校验 | 站点 unittest、Geo 完整 SiteModel 的编译器校验、本站 redirect/artifact 校验全部成功后才上传 |
| 发布 | 分支可以构建，只有 main 的成功 build 可以部署；短期 token 仅进入编译步骤的环境变量 |

本地验证请使用可写站点副本，沿用工作流的固定 SHA 和安装命令。
`UV_PROJECT_ENVIRONMENT` 必须指向源码之外、尚不存在的绝对路径；如安装独立 Python，
同时设置副本内的 `UV_PYTHON_INSTALL_DIR`、`UV_PYTHON_BIN_DIR` 和 `UV_CACHE_DIR`。
站点测试使用安装环境已有的 PyYAML，无单独依赖清单。

升级前保留当前 Config、workflow、生成器身份和成功的 Pages artifact。
先推分支检查安装、构建和完整产物，再合入 main；上线后检查页面、旧链接、feed、
sitemap 和静态资源。构建成功不代替线上检查。

回滚通过新 revert commit 成套恢复已验证的 Config、workflow 与生成器版本，
不能只回退 pin。先核对期间的代码和 Issue 变化，以及当前内容对旧编译器的兼容性；
代码回滚不会撤销 Issue 编辑。保留成功产物，不覆盖期间的新内容。
