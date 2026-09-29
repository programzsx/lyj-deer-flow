# ReadabilityExtractor-档案

## 一、这个类是干什么的

ReadabilityExtractor是utils/readability.py里的类。

这个类从HTML提取正文文章。

它是网页抓取的可读性提取器。

它用readabilipy库的simple_json_from_html_string。

优先用Readability.js提取。

提取失败时回退到纯Python提取。

提取前先用_DestinationRewriter解析相对URL。

这个类位于backend/packages/harness/deerflow/utils/readability.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ReadabilityExtractor.extract_article方法

这个方法从HTML提取文章。

流程如下。

第一步带URL时先解析URL目的地。

第二步用readabilipy提取。

Readability.js提取失败时回退到纯Python提取。

失败包括子进程错误和找不到Readability.js。

警告日志带stderr信息。

第三步处理空内容。空内容用"No content could be extracted from this page"。

第四步处理空标题。空标题用"Untitled"。

第五步返回Article对象。

### 2、_resolve_html_urls函数

这个函数在提取丢掉文档base标签之前先解析URL目的地。

用BeautifulSoup找base元素。

base的href参与urljoin。

只保留urljoin能解析相对路径的base。

不透明的base回退到抓取的URL。

无效的base不阻止页面提取。

### 3、_DestinationRewriter类

这是内部类。

继承HTMLParser。

它重写HTML里的相对链接和图片地址。

只在实际start tag里tokenize属性。

保留源span避免在jsdom解析前重建坏掉的标记。

文本元素里的内容当数据处理。

CDATA内容元素包括script、style、textarea、title等。

只处理a的href和img的src。

浏览器用第一个重复属性。包括裸属性。

### 4、Article类

同模块的另一个类。

- title是标题。html_content是HTML内容。url是来源URL。
- to_markdown方法把内容转markdown。带标题。
- to_message方法把内容转成消息块列表。图片URL用urljoin解析成绝对地址。文本和图片交替排列。

## 三、它和谁协作

- jina_ai、crawl4ai等抓取工具用它提取正文。
- readabilipy库做实际提取。
- BeautifulSoup做base元素查找。

## 四、重要性评级

评级是6分。

理由如下。

这个类是网页正文提取的核心。

base标签在提取前解析。

原因是提取会丢掉base标签。

相对URL就解析不了了。

只保留源span的属性重写。

不重建坏掉的标记。

Readability.js失败回退纯Python。

这些都是真实的细节。

但它服务于抓取工具。

不在核心链。

扣掉4分。
