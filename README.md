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

## 构建与升级

工作流的 `ESCAPING_SHA` 是生成器版本的唯一固定值，不跟随移动分支。
运行时统一使用 Python 3.14.x；Actions summary 记录实际安装身份。

| 环节 | 约定 |
| --- | --- |
| 安装 | 干净、精确 SHA 的 compiler checkout，调用其 `starter/.github/scripts/install.sh`，按 lock 和 build group 安装为 noneditable 包 |
| 环境 | 虚拟环境及 cache 位于 runner temp，不写进 compiler source；测试和构建均使用安装环境的 Python |
| 配置 | 根目录 `config.yaml` 显式提供仓库与站点 URL；输出仍为根目录 `output/` |
| 校验 | 站点 unittest、编译器校验、本站 redirect/artifact 校验全部成功后才上传 |
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
