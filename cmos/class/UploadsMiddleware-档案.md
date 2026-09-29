# UploadsMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/uploads_middleware.py`

## 一、这个类是干什么的

UploadsMiddleware把本次运行上传的文件注入代理上下文。

前端上传成功之后。把文件元数据放进消息的additional_kwargs.files。
每个条目有文件名、大小、虚拟路径、状态。

这个中间件在代理执行开始前读这些元数据。
把`<current_uploads>`块加到最后一条用户消息前面。
模型就知道刚刚上传了哪些文件。

历史上传不再每轮注入。
代理按需用list_uploaded_files工具发现它们。

注入的内容有安全处理。

用户派生的值。文件名、路径、大纲标题、预览文本。
都用neutralize_untrusted_tags中和。
精心构造的文件名不能在可信的current_uploads包装里内嵌被封锁的权威标签。

文件列表有数量上限。超出的文件在提示里只列名字。

文件大小是客户端给的。
转换是尽力而为。
不可用的大小回退到0。绝不中断运行。

异步钩子把阻塞的文件系统扫描卸载到工作线程。
不阻塞事件循环。

## 二、类的成员

### （一）字段

- `state_schema`：固定为UploadsMiddlewareState。

### （二）方法

钩子方法是重点。

- `before_agent`：代理执行前注入本次运行的上传。
- `abefore_agent`：异步钩子。把同步扫描卸载到工作线程。run_in_executor会复制上下文。

核心方法：

- `__init__`：接收base_dir和每个上下文段的文件数上限。
- `_files_from_kwargs`：从消息元数据里提取文件信息。可验证文件存在性。不存在的跳过。
- `_select_files_for_context`：按上传顺序返回有上限的上下文文件。返回入选和省略两组。
- `_create_files_message`：构造current_uploads格式的消息。
- `_format_file_entry`：追加单个文件条目。名称、大小、路径、可选大纲。用户派生值先中和。
- `_coerce_file_size`：从客户端给的大小字段尽力转出字节数。不可用的回退0。

## 三、它和谁协作

- 它挂在中间件链的靠前位置。lead专属。
- 它依赖ThreadDataMiddleware建好的uploads目录。
- 它消费前端写入的additional_kwargs.files。
- 它的中和逻辑和InputSanitizationMiddleware共享neutralize_untrusted_tags。
- list_uploaded_files工具负责历史上传的按需发现。

## 四、重要性评级

评级：6/10。

理由：上传注入是文件功能的第一公里。没有它模型不知道用户刚传了什么。中和处理防止文件名成为注入载体。异步卸载保住事件循环。但它的逻辑面窄。只管当前上传的展示。所以给6分。