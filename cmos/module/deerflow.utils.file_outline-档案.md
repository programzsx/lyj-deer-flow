# deerflow.utils.file_outline 档案

## 一、这个模块是干什么的

这个模块做"共享的文档大纲提取"。

用户上传文档后。系统要给agent一个文档大纲。让agent知道文档结构。

大纲是从转换后的Markdown文件里提取的。

它从`file_conversion.py`和`uploads_middleware.py`里提取出来。让中间件和`list_uploaded_files`工具用同一份代码。

## 二、模块里的主要成员

- `_BOLD_HEADING_RE`。SEC文件的结构性标题正则。pymupdf4llm无法把加粗文本提升成Markdown标题时。会输出`**ITEM 1. BUSINESS**`这种形式。这个正则认ITEM、PART、SECTION、SCHEDULE、EXHIBIT、APPENDIX、ANNEX、CHAPTER开头。

- `_SPLIT_BOLD_HEADING_RE`。拆分加粗标题的正则。pymupdf4llm在PDF里节号和标题是分开的文本段时。输出`**1** **Introduction**`。这个正则要求第二个块不是纯数字。排除财务表格头。同时允许非ASCII标题。最多四个块。保持线性。避免ReDoS。

- `MAX_OUTLINE_ENTRIES`。注入agent上下文的大纲条目上限。50条。保证超长文档的提示词大小有界。

- `_ATX_HEADING_RE`。标准Markdown标题正则。1到6个井号。允许最多3个前导空格。空格或tab分隔。

- `_strip_atx_closing_hashes(raw)`。线性时间剥掉行尾的井号串。

- `_clean_bold_title(raw)`。清洗标题里的加粗残留。合并相邻的加粗段。剥最外层包装。

- `_truncate_outline_text(text, max_chars)`。截断文本。省略标记保持在字符预算内。

- `extract_outline(md_path)`。主函数。从Markdown文件提取大纲。认三种标题。返回`{title, line}`列表。title最多200字符。line是1基行号。截断时附加`{"truncated": True}`哨兵条目。调用者不用重扫文件就能渲染"只显示前N条"提示。文件读不了返回空列表。

- `extract_outline_for_file(file_path)`。返回文档大纲和兜底预览。找同名的.md文件。有大纲返回大纲。没大纲读前几行非空行做内容锚点。预览最多5行。总共2000字符。

## 三、它和谁协作

它只依赖标准库re和pathlib。

它被`utils/file_conversion.py`再导出。

它被上传中间件和`list_uploaded_files`工具依赖。

它读的是文件转换管线生成的.md文件。

## 四、重要性评级

评级是4分。

理由如下。

大纲是agent理解上传文档结构的入口。没有大纲。agent只能盲读全文。

正则的设计很细。ATX闭合标记用线性后缀扫描。不用无锚点的空白正则。避免ReDoS。拆分加粗标题排除纯数字块。这些细节在AGENTS.md里有专门条目。

utf-8-sig读取处理了BOM。BOM会藏住第一行标题。

扣分原因。它是增强功能。大纲提取失败不丢数据。文档照常可用。它是可观察性辅助而非核心机制。
