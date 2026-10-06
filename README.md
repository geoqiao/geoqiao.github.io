# geoqiao.me

The site is an [Astro](https://astro.build/) project with its own design, **[Geo](docs/geo.md)**. Content is written in GitHub Issues; [escaping](https://github.com/geoqiao/escaping) exports the published Issues as Markdown and this repository builds every page from them. Build and preview locally with `bash scripts/preview_geo.sh`, then open <http://localhost:8765>.

这是站点源码仓库。站点内容来自 GitHub Issues；`config.yaml`、`src/`、`public/`、`.github/workflows/pages.yml` 和迁移脚本是源码。workflow 先用 escaping 把已发布的 Issue 导出为 Markdown（`content/`），用 Astro 构建一遍作为检查，通过后把 `content/` 提交回 main。站点部署在 Cloudflare Workers 上：Cloudflare 在 main 每次有新提交时运行 `pnpm build` 和 `npx wrangler deploy`。`content/` 由 workflow 写入，不要手工修改。

主要源码：

- GitHub Issues：Blog 与 About 内容源
- `config.yaml`：站点配置。escaping 读取仓库、作者白名单和 About Issue；站点读取其余部分（身份、导航、SEO、评论、旧地址、项目）
- `src/`：页面、布局、Markdown 渲染与清洗、feed/sitemap/搜索索引；`src/site.config.ts` 是首页精选文章等展示选项
- `public/`：原样发布的静态资源（`public/assets/` 即 `/assets/`）
- `config.yaml` 的 `projects:`、`src/project-pages/`：项目目录与独立产品首页；每个项目需要 `src/project-pages/<slug>.html`，发布在 `/projects/<slug>/`
- `.github/workflows/pages.yml`：导出、检查并提交内容的流程；`wrangler.jsonc`：Cloudflare 的部署配置
- `assets/profile/`：头像原件；Geo 使用 `public/assets/images/avatar.png` 的本地副本作为头像与 favicon
- `assets/social/`：全站分享图；`seo.social_image` 引用固定 commit 直链，维护步骤见[图片说明](assets/social/README.md)
- `assets/issues/<issue-number>/`：文章附件原件；正文使用固定 commit 的 GitHub 直链
- `assets/charts/`：已有 #62 图表与 CSV，保留原路径
- `content-migrations/`：附件迁移映射与 SHA-256 校验值
- `scripts/prepare_attachment_migration.py`：离线生成附件迁移预览，不写 GitHub

附件上传顺序、备份及部署边界见 [附件维护约定](docs/attachments.md)。

`dist/`（站点）与 `build/`（内容导出）只包含本地或 CI 构建生成物，不提交到仓库。旧的根目录 HTML/feed/sitemap/robots、`blog/`、`tag/` 和 `templates/Escape2/` 均为历史生成物，不是源码。

## 本站博客发布规范

escaping 的通用契约允许省略部分元数据，但本站博客必须显式填写 `slug`、`description`、`created_date`。
`slug` 使用表达文章主题的英文单词，以连字符分隔，可含年份；正式地址为 `/blog/{slug}/`，不使用 Issue 编号或纯数字占位。`description` 是简洁的内容摘要，`created_date` 是带引号的真实原始创作日期。
标题使用 Issue 原生标题，类型/标签/发布状态使用 GitHub labels；Issue body 的 front matter 仅保留上述三项。

既有文章通常保持地址不变。作者明确授权纠正错误地址时，先在 `config.yaml` 的 `redirects` 增加旧地址到新地址的一行，再修改最新远端 Issue 的 slug；不从本地历史稿覆盖正文。站点为每个旧地址生成带 canonical 和即时跳转的页面；旧地址仍是文章页时，文章页优先，跳转页暂不生成（构建日志给出警告）。
修改后核验新页、旧址跳转、首页、Atom、sitemap 和评论的原 Issue 绑定；不得因改地址新建 Issue、重置日期或搬动附件。

同一篇文章再次改名时，保留原来那行，并追加当前地址到新地址的一行。站点沿着这些行找到仍存在的文章页，让所有旧地址直接跳到最新地址，不依赖顺序；循环的旧地址会让构建失败。

## 内容变更与撤稿

工作流监听 Issue 的创建、编辑、标签变更、关闭、重开、删除与转移。
`deleted`、`transferred` 是 GitHub 支持的 [`issues` 事件类型](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues)，不是需要创建的标签；这类事件要求工作流文件位于默认分支。

移除 `published` 才是常规撤稿操作，仅关闭 Issue 不会撤稿。撤稿、删除或转移时，一并处理 `src/site.config.ts` 的 `featuredPosts`、指向该文的正文内链和 `redirects` 里指向它的行；指向已不存在页面的站内链接会让构建失败，失效的精选文章和旧地址只给出警告并被略过。只有构建、校验和部署全部成功后，线上内容才更新；不要删除校验来绕过失败。

## 构建与升级

工作流里的 `uvx escaping-site@X.Y.Z` 是 escaping 版本的唯一固定值；升级时改版本号。
`uvx` 从 PyPI 安装这个版本到临时环境并导出内容，PyPI 上已发布的版本不可覆盖；导出格式见 [content export v1](https://github.com/geoqiao/escaping/blob/main/docs/contracts/content-export-v1.md)，站点只接受 `export_version: 1`。
站点依赖由 `pnpm-lock.yaml` 固定，CI 使用 `pnpm install --frozen-lockfile`。

| 环节 | 约定 |
| --- | --- |
| 测试 | 站点 unittest 在导出前运行：`uv run --no-project --python 3.14 --with pyyaml==6.0.3`；Markdown 清洗规则的测试在构建前运行：`pnpm test` |
| 导出 | `escaping-site export` 读取根目录 `config.yaml`，校验 Issue 并把已发布内容写到 `content/` |
| 构建 | `pnpm build` 生成整站（含 `/projects/<slug>/` 和 `redirects` 的旧地址页）到 `dist/`，并检查所有站内链接都指向已生成的页面或文件 |
| 提交内容 | main 上构建通过且 `content/` 有变化时，workflow 以 `github-actions[bot]` 提交 `content: update from Issues`；内容没变就不提交，构建失败也不提交 |
| 发布 | Cloudflare 的 Git 构建在 main 的每次提交后构建并部署；分支不部署。有 Issue 被跳过时其余内容照常提交和发布，随后工作流标红并列出这些 Issue |

本地预览与检查见 [Geo 说明](docs/geo.md)。

`wrangler.jsonc` 把 `dist/` 作为 Cloudflare Workers 的静态资源部署到 `geoqiao.me`，仓库里有了 `content/`，Cloudflare 只用 `pnpm build` 就能构建。构建设置（仓库、分支、命令）在 Cloudflare 控制台的 Worker `geoqiao-me` → Settings → Builds。`dist/_redirects`（构建时生成）让缺尾斜杠的地址 301 到带斜杠的页面，`public/_headers` 保留跨域读取，`wrangler.www.jsonc` 把 `www.geoqiao.me` 301 到主域名；它不随 Git 构建部署，改动后手动运行 `pnpm exec wrangler deploy --config wrangler.www.jsonc`。

GitHub Pages 的设置（自定义域名 `geoqiao.me`）保持不动：它让 `geoqiao.github.io` 的旧地址继续 301 到 `geoqiao.me`。DNS 里不再有指向 GitHub 的记录。

升级前保留当前 Config、workflow、escaping 版本和 lockfile；Cloudflare 保留每次部署的版本，可用 `pnpm exec wrangler rollback` 回到上一个。
先推分支检查安装、构建和完整产物，再合入 main；上线后检查页面、旧链接、feed、
sitemap 和静态资源。构建成功不代替线上检查。

回滚通过新 revert commit 成套恢复已验证的 Config、workflow、站点源码与 escaping 版本，
不能只回退 pin。先核对期间的代码和 Issue 变化，以及当前内容对旧版本的兼容性；
代码回滚不会撤销 Issue 编辑。保留成功产物，不覆盖期间的新内容。
