# geoqiao.github.io

自从学习Python以来，一直有个自己写一个博客页面的想法，今天终于初步实现了。

**原理非常简单**：

1. 使用 PyGithub 读取GitHub仓库的 issues 
    > 可以返回 issue 的标题、创建时间、标签、内容等
2. 利用 GitHub API 将第一步得到的 markdown 格式的 issue 内容转换为 HTML
3. 使用 Jinja2 写一个HTML模板，并将第一步得到的内容渲染

**demo**

[geoqiao's pages](https://geoqiao.github.io/contents)

还很简陋，但能写到这样已经很开心了
