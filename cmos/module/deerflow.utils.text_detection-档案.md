# deerflow.utils.text_detection 档案

## 一、这个模块是干什么的

这个模块做"内容采样的文本与二进制检测"。

两个函数。都很短。

一个判断文件是不是文本文件。一个判断MIME类型是不是"活跃内容"。

活跃内容的意思是。浏览器内联渲染这种类型时能执行脚本。

这个判断是下载安全边界。路由和harness工具共享它。

## 二、模块里的主要成员

- `is_text_file_by_content(path, sample_size=8192)`。按内容判断文件是否为文本。读前8192字节。没有null字节就是文本。异常返回False。fail closed。

- `ACTIVE_CONTENT_MIME_TYPES`。活跃内容MIME类型集合。text/html、application/xhtml+xml、image/svg、image/svg+xml、text/xml、application/xml、text/xsl。

- `_is_active_content_mime_type(mime_type)`。判断浏览器内联渲染这个类型时能否执行脚本。

  - 覆盖所有WHATWG XML类型。text/xml、application/xml、加`+xml`后缀的子类型。

  - 覆盖Windows的`image/svg`别名。对齐标准类型`image/svg+xml`。

  - 覆盖text/xsl。Blink也把它渲染成XML。

  - 原因是。任何XML文档都能携带XHTML命名空间的script标签。所以report.xml和feed.rss在应用源里打开时和page.html一样危险。

## 三、它和谁协作

它只依赖标准库pathlib。

它被下载安全边界依赖。artifacts和project documents的下载判断共享它。

它被routers和harness工具依赖。

`ACTIVE_CONTENT_MIME_TYPES`集合是共享定义。AGENTS.md要求新的自动捕获入口复用这个定义。防止字节编码和后缀漂移。

## 四、重要性评级

评级是5分。

理由如下。

它是下载安全边界。判断错了。恶意SVG或XML就在应用源里执行了脚本。这是XSS漏洞。

`+xml`通用规则和平台别名的处理让边界完整。report.xml、feed.rss都不能绕过。

fail closed的设计。检测异常按非文本处理。

扣5分是因为它只有44行。两个小函数。逻辑简单。但它是安全边界。分数给到中游。
