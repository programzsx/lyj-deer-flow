# Article-档案

## 一、这个类是干什么的

Article是utils/readability.py里的类。

它表示从网页提取出的一篇文章。

字段是title加html_content加url。

它能转成markdown。能转成模型消息内容。

这个类位于backend/packages/harness/deerflow/utils/readability.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

title是文章标题。

html_content是文章HTML内容。

url是文章URL。默认空字符串。

### 2、to_markdown方法

它把HTML内容转成markdown。

including_title为True时先加标题。

HTML内容为空或空白时输出*No content available*。

转换用markdownify。

### 3、to_message方法

它把markdown转成模型消息内容列表。

用image_pattern拆分markdown。

奇数位置是图片URL。用urljoin基于self.url解析相对地址。输出image_url类型。

偶数位置是文本。输出text类型。

空内容时输出No content available的fallback。

### 4、ReadabilityExtractor.extract_article

它提取文章。

URL存在时先_resolve_html_urls解析相对地址。

simple_json_from_html_string用readability.js提取。

提取失败时降级为纯Python提取。CalledProcessError和FileNotFoundError。

stderr解码errors=replace。

content为空时输出No content could be extracted from this page。

title为空时输出Untitled。

### 5、_resolve_html_urls

它在提取丢弃文档base标签之前解析目的地。

先找base标签。html5lib解析。

base URL必须是urljoin能解析相对路径的。uses_relative里的scheme。

无效base不阻止页面提取。

### 6、_DestinationRewriter

它重写a href和img src的目的地。

只tokenize start tag里的属性。HTMLParser识别。

CDATA内容元素包括script、style、textarea、title、xmp、iframe、noembed、noframes、plaintext。

保留源span。避免在jsdom解析之前重建畸形标记。

第一个重复属性生效。和浏览器一致。包括bare属性。

## 三、它和谁协作

- ReadabilityExtractor构建它。
- community抓取工具消费to_message。
- markdownify和readabilipy做转换。
- _DestinationRewriter做URL解析。

## 四、重要性评级

评级是5分。

理由如下。

这个类是网页提取结果的载体。

to_message把markdown拆成文本和图片。相对图片地址用urljoin解析。

空内容有fallback。

DestinationRewriter保留源span。不重建畸形标记。CDATA元素里的示例文本当数据。

base标签解析在提取之前。

这些质量不错。

扣掉5分。

扣分原因是它自身逻辑量中等。核心质量在DestinationRewriter。
