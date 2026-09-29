# convert_file_to_markdown-档案

## 一、这个类是干什么的

convert_file_to_markdown不是类。

convert_file_to_markdown是utils/file_conversion.py里的模块级函数。

这个函数把文档文件转成Markdown。

支持PDF、PPT、Excel、Word。

这个模块定义了PDF转换的auto策略。

策略分三步。

第一步，装了pymupdf4llm就优先用它。它的标题检测更好，多数文件更快。

第二步，输出可疑地短时（每页少于50字符，或总字符少于200），当成图片型PDF，回退到MarkItDown。

第三步，没装pymupdf4llm就直接用MarkItDown。

大文件超过1MB阈值时用asyncio.to_thread在线程池转换。

避免阻塞事件循环。

这修复了issue #1569。

这个模块没有FastAPI或HTTP依赖。

是纯工具函数。

这个模块位于backend/packages/harness/deerflow/utils/file_conversion.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、CONVERTIBLE_EXTENSIONS常量

可转换扩展名包括.pdf、.ppt、.pptx、.xls、.xlsx、.doc、.docx。

### 2、_ASYNC_THRESHOLD_BYTES常量

值是1MB。

超过的文件在后台线程转换。

小文件同步完成不到1秒。

为它们开线程徒增调度开销。

### 3、_MIN_CHARS_PER_PAGE常量

值是50。

pymupdf4llm输出每页少于50字符时可能图片型或加密。

回退到MarkItDown。

理由是正常文本PDF每页200到2000字符。

图片型接近0。

50字符给足安全余量。

页数不可用时回退到绝对200字符检查。

### 4、_pymupdf_output_too_sparse函数

这个函数判断pymupdf4llm输出是否可疑地短。

用每页字符数而不是绝对阈值。

短文档和长文档都能正确判断。

### 5、convert_file_to_markdown函数

这是主转换函数。

按上面的策略选择转换器。

大文件通过file_io的执行器转换。

### 6、向后兼容re-exports

大纲提取移到了file_outline.py。

这里re-export MAX_OUTLINE_ENTRIES和extract_outline保持兼容。

## 三、它和谁协作

- DeereFlowClient.upload_files和Gateway上传路由调用转换。
- utils/file_io的执行器承载大文件转换。
- utils/file_outline提供大纲提取。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是文档上传转换的核心。

PDF的auto策略处理了图片型PDF回退。

每页字符数判断比绝对阈值更稳。

大文件线程转换防事件循环阻塞。

但它是工具函数。

依赖外部pymupdf4llm和markitdown。

扣掉4分。
