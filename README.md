# github-blog

自从学习 Python 以来，一直有个自己写一个博客页面的想法，今天终于初步实现了。

**原理非常简单**：

1. 使用 PyGithub 读取 GitHub 仓库的 issues
   > 可以返回 issue 的标题、创建时间、标签、内容等
2. 利用 GitHub API 将第一步得到的 markdown 格式的 issue 内容转换为 HTML
3. 使用 Jinja2 写一个 HTML 模板，并将第一步得到的内容渲染

**demo**: [geoqiao's pages](https://geoqiao.github.io/)

## 使用方法

1. 创建<user_name>.github.io 仓库
2. 将此仓库的所有文件复制到<user_name>.github.io 仓库中
3. 配置 GitHub Token & [utterances](https://utteranc.es/)
4. 修改`./configs/config.yaml`文件中的配置信息，例如将用户名、博客名称切换为你自己的
5. 修改 index.html 为你的个人信息
6. 创建你的 issues

## ROADMAP && TODO

- [x] 优化 HTML 模板（尽力了... 等更熟悉 CSS 之后再搞
- [x] 增加 GitHub Actions 支持，实现 issue 更新后自动部署
- [x] 慢慢优化代码，比如模板中涉及到仓库和 GitHub 用户名的部分全部改为变量（现在优先实现功能、优化先放一放
- [x] 分享搭建的过程，输出中巩固
- [x] 增加基于 issue 的评论功能
- [x] 增加模板选择功能（就差新模板了）
- [ ] 增加 SEO 优化配置项
- [ ] 增加这个代码仓库更新后，自动同步至 GitHub Pages 仓库的功能

## 非常感谢

**[gitblog](https://github.com/yihong0618/gitblog)**

我之前使用的是 yihong 老师的 gitblog ~~（自己写的还没能完全自动化）~~，也是从 yihong 老师这里第一次看到了用 issue 写博客，还能用 GitHub 和 Python 实现几乎完全自动化，真是太牛了。如果有写博客的需求，强烈推荐这个项目。

**[Gmeek](https://github.com/Meekdai/Gmeek)**

关注 Gmeek 项目也很久，从这里知道了如何使用 GitHub API 实现 markdown 转 HTML。这个项目已经很完善，按教程操作走，很快就可以实现 GitHub Pages 的搭建。

以及 **Gemini/poe** 等一大批 ai 工具，作为编程初学者赶上这个两年，真的受益良多

**[utterances](https://utteranc.es/)**

评论功能由 utterances 实现，非常简单好用！
