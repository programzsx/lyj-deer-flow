# _DestinationRewriter-档案

## 一、这个类是干什么的

_DestinationRewriter是utils/readability.py里的内部类。

它继承HTMLParser。

它重写a href和img src的目的地。

把相对地址解析成绝对地址。

这个类位于backend/packages/harness/deerflow/utils/readability.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

convert_charrefs为False。

html是原始HTML。

base_url是解析基准。

line_offsets记录每个换行的偏移。

replacements是(起始偏移, 结束偏移, 新值)列表。

### 2、CDATA_CONTENT_ELEMENTS

script、style、textarea、title、xmp、iframe、noembed、noframes、plaintext。

纯文本元素里的链接示例当数据。

包括嵌套的script样文本。

只有匹配的关闭标签恢复tokenization。

plaintext永不恢复。

### 3、handle_starttag方法

text_element非None时直接返回。

textarea、title等纯文本元素设置text_element。

a标签找href。img标签找src。

get_starttag_text取原始start tag文本。

_ATTRIBUTE_RE在tag end之后tokenize属性。

属性值带引号时unescape。urljoin解析。

resolved和original不同时记录替换。escape(resolved, quote=True)。

无值属性时插入=base_url。

第一个重复属性生效。和浏览器一致。包括bare属性。

### 4、handle_endtag方法

匹配text_element且不是plaintext时恢复tokenization。

### 5、handle_startendtag方法

委托给handle_starttag。自闭合标签。

### 6、result方法

按replacements拼接。替换源span。不重建整个文档。

### 7、保留源span的原因

避免在jsdom解析之前重建畸形标记。

只改href和src的值。其他字节不动。

## 三、它和谁协作

- _resolve_html_urls调用它。
- ReadabilityExtractor在提取前解析URL。
- HTMLParser做解析。

## 四、重要性评级

评级是5分。

理由如下。

这个类是网页相对地址解析的机械件。

保留源span。畸形标记不被重建。

CDATA元素防止script里的示例文本被改写。

第一个重复属性和浏览器一致。包括bare属性。

无效base不阻止提取。

这些是提取正确性的关键。

扣掉5分。

扣分原因是它是提取管线的内部辅助类。
