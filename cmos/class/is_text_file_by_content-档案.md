# is_text_file_by_content-档案

## 一、这个类是干什么的

is_text_file_by_content不是类。

is_text_file_by_content是utils/text_detection.py里的模块级函数。

这个函数按内容检测文件是文本还是二进制。

检测方式是检查内容里有没有null字节。

文本文件不应该包含null字节。

这个模块还提供活动内容MIME类型检测。

_is_active_content_mime_type判断浏览器内联渲染这个MIME类型时能否运行脚本。

这个模块被路由器和harness工具共享。

这个模块位于backend/packages/harness/deerflow/utils/text_detection.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、is_text_file_by_content函数

参数是path和sample_size。

sample_size默认8192。

读取前8192字节。

不含null字节就是文本文件。

异常时返回False。

### 2、ACTIVE_CONTENT_MIME_TYPES常量

包括text/html、application/xhtml+xml、image/svg、image/svg+xml、text/xml、application/xml、text/xsl。

### 3、_is_active_content_mime_type函数

这个函数判断MIME类型是否是活动内容。

覆盖范围如下。

HTML之外还包括每个WHATWG XML MIME类型。

text/xml、application/xml和+xml子类型。

Windows的image/svg别名。

text/xsl。Blink也把它当XML渲染。

任何XML文档可以携带XHTML命名空间的script。

所以report.xml或feed.rss在应用源里打开时和page.html一样危险。

## 三、它和谁协作

- Gateway路由器用文本检测区分文件类型。
- harness工具用活动内容检测做安全判断。

## 四、重要性评级

评级是5分。

理由如下。

这两个检测函数是共享的安全判定。

+xml子类型覆盖是真实的XSS细节。

任何XML都能带script。

但它只有两个短函数。

扣掉5分。
