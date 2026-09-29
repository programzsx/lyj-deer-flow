# _LargeFileToolChunkBatcher档案

源码位置：backend/packages/harness/deerflow/runtime/runs/worker.py

## 一、这个类是干什么的

_LargeFileToolChunkBatcher是文件工具参数增量的批量器。

_LargeFileToolChunkBatcher把write_file和str_replace的文件体参数增量攒成批再发。

攒批的目的是避免浏览器二次方解析。普通assistant文本是token流式发送的。每个模型token浏览器都要重新解析增长的JSON。文件体参数很大。逐token发送会让浏览器解析成本变成二次方。

大文件参数仍然渐进更新。但改成有界批量。批量大小是32。

类名带下划线前缀。这是worker.py的内部类。外部不直接使用。

## 二、类的成员

（一）字段

- `batch_size`：批量大小。默认32。
- `tool_names`：正在累积名字的身份到名字片段的映射。工具名可能分多个chunk到达。
- `pending_identity`：当前正在累积的身份。身份是namespace加message_id加discriminator的元组。
- `pending_message`：正在累积的消息。
- `pending_metadata`：正在累积的元数据。
- `pending_count`：已累积的chunk数。

（二）方法

- `push()`：推入一个messages模式的chunk。不是文件工具的chunk直接透传。是文件工具的chunk进入累积。达到批量大小就flush。返回要发布的chunk列表。名字累积不完整的工具名仍然逐chunk流式。
- `flush()`：把累积的chunk作为一条发出。清空累积状态。
- `finish()`：flush并释放所有身份缓存。在values或流结束边界调用。普通的批量flush保留身份。因为后续chunk通常不带工具名。

## 三、它和谁协作

（一）_publish_stream_item

worker.py的_publish_stream_item使用这个批量器。messages模式调push。values模式调finish。非message帧先flush挂起的批。

（二）StreamBridge

批量器产出的chunk经serialize后通过bridge.publish发布到SSE。

（三）模块级常量

_LARGE_FILE_TOOL_NAMES定义哪些工具名走批量。目前是write_file和str_replace。_LARGE_FILE_TOOL_BATCH_SIZE定义批量大小。

## 四、重要性评级

评级：5分。

理由：_LargeFileToolChunkBatcher解决了一个真实的性能问题。大文件参数逐token发送会让浏览器解析成本二次方增长。攒批把成本变成线性。它只影响流式传输层。不影响运行状态。所以给5分。
