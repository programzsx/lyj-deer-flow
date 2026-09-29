# deerflow.utils.file_conversion 档案

## 一、这个模块是干什么的

这个模块做"文档转Markdown"。

用户上传PDF、PPT、Excel、Word文档。系统要把它们转成Markdown。让agent能读。

PDF的转换是重点。PDF分两种。文本型PDF和图片型PDF。文本型直接提取文字。图片型需要OCR。 pymupdf4llm擅长文本型。MarkItDown是兜底。

这个模块的策略是auto模式。先用pymupdf4llm。如果产出可疑地短。判定为图片型。回退到MarkItDown。

大文件超过1MB时放到线程池转。不阻塞事件循环。

## 二、模块里的主要成员

- `CONVERTIBLE_EXTENSIONS`。可转换的扩展名集合。pdf、ppt、pptx、xls、xlsx、doc、docx。

- `_pymupdf_output_too_sparse(text, file_path)`。判断pymupdf4llm的产出是否可疑地短。用每页字符数而不是绝对阈值。正常文本PDF每页200到2000字符。图片型接近0。阈值是每页50字符。页数拿不到时退到绝对200字符。

- `_convert_pdf_with_pymupdf4llm(file_path)`。尝试pymupdf4llm转换。没安装返回None。失败（加密或损坏的PDF）也返回None。

- `_convert_with_markitdown(file_path)`。用MarkItDown转任何支持的文件。

- `_do_convert(file_path, pdf_converter)`。同步转换核心。pdf_converter可以是auto、pymupdf4llm、markitdown。auto模式下pymupdf产出太稀疏就回退MarkItDown。显式pymupdf4llm模式无论多短都用。

- `convert_file_to_markdown(file_path, output_path)`。主异步入口。读文件大小。大文件用`asyncio.to_thread`。写回用`await_drained`排干取消。取消时清理部分输出。失败返回None。

- `_get_pdf_converter()`。从app config读pdf_converter设置。默认auto。小写归一。校验合法集合。非法值警告回退auto。

- `extract_outline`和`MAX_OUTLINE_ENTRIES`。从file_outline模块的向后兼容再导出。大纲提取已经移到那里。

## 三、它和谁协作

它依赖`utils/file_io.py`的run_file_io和await_drained。做阻塞卸载和取消排干。

它依赖`utils/file_outline.py`做大纲提取。

它依赖`config/app_config.py`读转换器设置。

它依赖可选的pymupdf4llm和必需的markitdown做转换。

它的调用方是上传处理管线。上传文档时调它生成伴生的.md文件。

## 四、重要性评级

评级是5分。

理由如下。

文件上传是用户直接使用的功能。转换失败用户立刻看到。

auto模式的稀疏检测设计不错。用每页字符数。短文档和长文档都正确处理。

取消时的清理处理很细。部分输出不留垃圾。

扣5分是因为它是可选增强功能。不转文档系统照常跑。转换失败也不丢用户数据。原始上传文件还在。
