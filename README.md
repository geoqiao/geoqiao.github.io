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

## Python 3.14 生产迁移

当前 `ESCAPING_SHA` 固定为 [生成器 PR #26](https://github.com/geoqiao/escaping/pull/26)
合入后的 main commit `caaea758f7d0feea128f17e81ac08b0612fdacea`，不跟随移动分支。
它与已验 Ubuntu commit `55316711b720f4b3e573966fbb4d9e81e4c1bdfb` 整树相同。
编排提供的 [Ubuntu/Python 3.14.7 CI](https://github.com/geoqiao/escaping/actions/runs/34021510777)
结果为 544 passed、无 skip、全部静态通过；main push CI 另由编排核验。

| 边界 | 本站做法 |
| --- | --- |
| Config | 保持仓库根 `config.yaml`；仅补显式 Home `/` 和 `comments.enabled: true`，保留 Quiet、About #42、两 Projects、空 description 与原评论协议 |
| 安装 | fresh compiler checkout；调用该 SHA 自带的 `starter/.github/scripts/install.sh`，uv 0.12.0、Python 3.14、`--locked`、build group、noneditable；环境和 cache 放在 runner temp，不在 compiler source 内 |
| 执行 | 只运行安装环境的 `python`/`escpe`，不用 `uv run --project`；安装身份写入 Actions summary；token 仅在编译 step 的 env 中 |
| 发布门槛 | 安装 → 本站 unittest → 编译器校验/安全发布 → 本站 `render_slug_redirects.py` 校验 → upload；任一步失败均停止，只有 main 的成功 build 可 deploy |
| 权限 | 保留 build 的 contents/issues read 与 deploy 的 pages/id-token write；不新增 labels、Pages setup/context、PR 部署入口或平台写能力 |

本站已显式配置 repo/URL，不需要 starter 的 Pages context 查询；缺失 Profile 字段仍由
安装后的 CLI 通过 repository identity/public Profile 解析，不伪造身份或临时改写 Config。
输出固定为根下 `output/`，编译器 containment 与本站最终 artifact 校验均保留。

本地按同样安装方式验证（在**可写副本站点**根执行，`compiler` 必须是 fresh exact-SHA checkout）：

```bash
set -euo pipefail
# 本地 Python、环境和 cache 都限制在可写副本，不能复用已存在的环境。
mkdir -p .scratch
runtime=$(mktemp -d "$PWD/.scratch/python314.XXXXXX")
export UV_PROJECT_ENVIRONMENT="$runtime/compiler-venv"
export UV_CACHE_DIR="$runtime/compiler-cache"
export UV_PYTHON_INSTALL_DIR="$runtime/python"
export UV_PYTHON_BIN_DIR="$runtime/bin"
uv python install 3.14
bash compiler/starter/.github/scripts/install.sh "$PWD/compiler" \
  caaea758f7d0feea128f17e81ac08b0612fdacea 3.14
"$UV_PROJECT_ENVIRONMENT/bin/python" -m unittest discover -s tests -v
# 真实构建另需通过 env 提供已有只读 GITHUB_TOKEN；不要写入文件或命令参数。
"$UV_PROJECT_ENVIRONMENT/bin/escpe" --config "$PWD/config.yaml"
"$UV_PROJECT_ENVIRONMENT/bin/python" scripts/render_slug_redirects.py \
  --map content-migrations/blog-slugs-2026-08.json --output output --repository-root "$PWD"
```

原 14 项 site unittest 不变；新增工作流边界测试使用编译器 locked 环境已有的 PyYAML，
不增加依赖。此次本地冻结输入重放生成 117 文件（72 canonical 页面、29 redirects），
与已验树逐文件相等；tree SHA-256 为
`351b02e14ec59d7438ae5bb844e95da40d18df2a89f36d6ef6401e66f9f69c55`，
算法为 `sha256(json.dumps(path_to_sha256, sort_keys=True).encode())`。
这是冻结样本回归基准；生产 Issues/Project metadata 变化时不能机械要求同一 hash。

### 生产执行与回滚（仅由编排单写）

1. 核验生成器 main push CI 与当前固定 SHA 的安装身份。以后升级只显式更新 workflow
   的 `ESCAPING_SHA`；若源码/lock 有新差异，先重新安装验证，不沿用本次结论。
   保存切换前 site SHA、成功 Pages run/artifact 身份及 Issue 快照；不修改正文或附件。
2. 在授权后推送迁移分支，检查现有分支 build 的安装身份、全部 tests、编译和 redirect
   日志及完整 artifact；应无 deploy。确认后合入 site main，才让现有链执行生产部署。
3. 部署后检查 Home/Blog/About/Projects、72 canonical/29 redirect 对应的当前内容集合、
   RSS/sitemap、Quiet 静态资源和原评论加载（不发测试评论或故障 Issue）。失败停止切换；
   域名、附件、内容、评论协议或权限若需变更，另行确认。
4. 回滚用新 revert commit 撤销本次 site 迁移及后续 pin 更新，完整恢复基线
   `8f724688563aa180555b7a5d57c447200682a98b` 的 config/workflow 行为（旧 compiler
   `b85ac6ea60cffec8f26687f72404b3a3139b6eca` 和旧安装/Python 链），不是仅改一个 pin。
   先核对期间变更，不能 reset/覆盖他人内容；经授权合入 main 重建并验证。
   此回滚不撤销期间 Issue 编辑，也不删除附件或更改 DNS。

| 验证范围 | 状态 |
| --- | --- |
| 此固定候选的本地 installed 消费 | 已验 Python 3.14.6、117 文件相等、必要输入/路径/后处理失败阻断；没有重复实时 L3 |
| Ubuntu 544 项与全部静态 | 编排提供 run 34021510777；本地核对正式 main 与该已验 commit 整树相同 |
| main push CI、site 分支 Actions、生产部署与线上验收 | 由编排执行并记录，本地验证不代替远端结果 |
| 新用户模板全部 T1、首次平台初始化、Release/template 交付 | 不属于本站固定版生产验证的完成范围；不以本次结论销项 |
| T1 沙箱 / DNS / Hostinger | 已撤回；本次不执行 |
