# deerflow.utils.readability 档案

## 一、这个模块是干什么的

这个模块做"网页正文提取"。

场景是web_fetch工具抓回一个网页的HTML。

HTML里全是导航栏、广告、脚本。正文只占一小部分。

这个模块用Readability算法把正文提出来。转成Markdown或者消息内容块。

它还处理一个细节。HTML里的相对链接和图片地址。要在提取之前先解析成绝对地址。因为提取会丢掉文档的base标签。

## 二、模块里的主要成员

- `Article`。提取结果。包含title、html_content、url。

  - `to_markdown(including_title=True)`。转Markdown。标题变成一级标题。正文用markdownify转。空内容输出占位提示。

  - `to_message()`。转消息内容块列表。正文里的Markdown图片语法被拆出来。变成image_url块。文本变成text块。图片相对地址用urljoin解析成绝对地址。

- `_resolve_html_urls(html, url)`。在提取前解析文档里的URL目的地。

  - 先找base标签。base标签需要字面的开始标签前缀。注释里的假阳性还会过HTML5树构建。

  - base地址要能被urljoin解析相对路径。不透明的base回退到抓取的URL。

  - 然后用`_DestinationRewriter`重写a的href和img的src。

- `_DestinationRewriter`。HTMLParser子类。逐个标记化属性。只在实际的开始标签内做。保留源span。不重建畸形标记。

  - 文本元素（script、style、textarea、title等）里的链接例子按数据处理。包括嵌套的脚本样文本。只有匹配的闭合标签才恢复标记化。

  - 属性值做HTML反转义。urljoin解析。再HTML转义回去。重复属性用第一个。浏览器的行为就是这样。

  - 替换按位置收集。最后一次性拼回。

- `ReadabilityExtractor`。提取器。

  - `extract_article(html, url)`。先解析URL。再用readabilipy的Readability算法提取。提取失败（子进程错误）时回退到纯Python提取。正文空时给占位文本。标题空时给Untitled。

## 三、它和谁协作

它依赖第三方库。BeautifulSoup、markdownify、readabilipy。readabilipy的Readability模式会调外部的Readability.js子进程。

它被`community`目录的web_fetch工具依赖。

它不依赖deerflow的其他模块。

## 四、重要性评级

评级是5分。

理由如下。

网页正文提取是web_fetch工具的核心能力。用户让agent读网页时全靠它。

相对URL解析的实现非常细。base标签的处理。文本元素的处理。重复属性的处理。HTML转义的处理。每一处都对齐浏览器行为。

提取失败时回退纯Python。可用性有保障。

扣5分是因为它是单一功能的工具。不涉及持久化、并发、授权。提取失败不丢数据。只影响单次抓取的质量。
