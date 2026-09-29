# extract_outline-档案

## 一、这个类是干什么的

extract_outline不是类。

extract_outline是utils/file_outline.py里的模块级函数。

这个函数从Markdown文件提取文档大纲。

大纲就是标题列表。

这个模块从file_conversion.py和uploads_middleware.py提取出来。

中间件和list_uploaded_files工具用同一份代码。

大纲最多50条。MAX_OUTLINE_ENTRIES是50。

这让提示词大小在很长的文档上也有界。

标题最多200字符。预览最多2000字符。

这个模块位于backend/packages/harness/deerflow/utils/file_outline.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、extract_outline函数

这个函数识别pymupdf4llm产出的三种标题样式。

第一种是标准ATX标题。

最多三个前导空格。1到6个井号。后跟空格、tab或行尾。

可选的闭合井号被去掉。

内联的**...**包装和相邻的粗体span被清洗成纯文本。

ATX标题要求1到6个井号加空格或tab分隔。

匹配原始缩进。缩进的代码不能变成标题。

闭合井号用线性后缀扫描去掉。

不用未锚定的空白正则。

对无界上传标题不能用非锚定正则。

第二种是纯粗体结构标题。

例如**ITEM 1. BUSINESS**、**PART II**。

SEC文件的节标题用粗体加大写。字号和正文一样。

pymupdf4llm无法把它们提升成#标题。

第三种是拆分粗体标题。

例如**1** **Introduction**。

节号和标题文本在PDF里是分离的span。

学术论文里常见。

正则要求整行只有**...**块。

第一个块是节号。

第二个块不能是纯数字。排除财务表格头。

最多四个块。保持正则线性。防ReDoS。

截断时追加{"truncated": True}哨兵条目。

调用者不用重扫文件就能渲染"showing first N headings"提示。

文件不能读或没有标题时返回空列表。

### 2、extract_outline_for_file函数

这个函数返回文件的大纲和回退预览。

它找同stem的.md伴生文件。

大纲非空时预览为空。

大纲为空时读.md的前几个非空行作为内容锚。

预览最多5行、2000字符。

### 3、_clean_bold_title函数

这个函数清洗pymupdf4llm的粗体残渣。

合并相邻粗体span。

剥掉最外层的**...**包装。

### 4、_strip_atx_closing_hashes函数

这个函数线性时间去掉空白分隔的闭合井号串。

### 5、_truncate_outline_text函数

这个函数在字符预算内保留省略标记。

### 6、围栏代码块处理

ATX提取跳过围栏代码块里的内容。

围栏允许反引号和波浪线两种。

反引号info串不能含反引号。

波浪线没有这个限制。

## 三、它和谁协作

- UploadsMiddleware用大纲注入代理上下文。
- list_uploaded_files工具用extract_outline_for_file。
- file_conversion.py re-export保持兼容。
- 上传转换管线产出同stem的.md伴生文件。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是文档大纲提取的共享实现。

它处理了三种标题样式。

包括SEC文件和学术论文的实际形态。

闭合井号用线性扫描不用非锚定正则。

防ReDoS设计明确。

截断哨兵避免重扫。

但它是文本处理工具。

不影响执行链。

扣掉4分。
