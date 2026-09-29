# deerflow.agents.middlewares.read_before_write_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/read_before_write_middleware.py。

## 一、这个中间件是干什么的

这个中间件做"先读后写"门控。

门控的对象是会改文件的工具。

write_file和str_replace属于这类工具。

这个中间件解决的问题是盲写。

主代理曾经出现重复输出失败。

同一段报告被追加了五次。

原因就是"只追加、从不读回"的写法。

这个中间件用版本门解决。

修改已存在的文件需要先read_file该文件的当前版本。

读取必须发生在对话的更早位置。

这个中间件默认开启。

配置项是read_before_write.enabled。

门控是确定性的。

不靠模型自觉。

## 二、模块里的主要成员

### 1、关键常量

READ_MARK_KEY是"deerflow_read_mark"。

读取标记盖在read_file的ToolMessage的additional_kwargs上。

WRITE_BLOCK_KEY是"deerflow_write_block"。

门控阻止的调用在错误ToolMessage上盖这个标记。

_READ_TOOLS是read_file。

_GATED_WRITE_TOOLS是write_file和str_replace。

_PAYLOAD_FIELDS记录每个工具的载荷参数。

write_file的载荷是content。

str_replace的载荷是old_str和new_str。

这些参数是一次写调用的主体。

路径、描述、标志在阻止后保持可见。

_UNINSPECTABLE_CONTENT_PREFIX是"Error:"。

AIO和E2B这类沙箱把读失败转成"Error: ..."字符串。

包括文件不存在的情况。

带这个前缀的内容当作"无法检查"处理。

门fail open。

不盖标记。

### 2、锁机制

锁的键是scope加规范化路径。

锁的作用是串行化门检查和工具执行。

LangGraph会并发运行同一条AIMessage的工具调用。

没有临界区的话两个同轮写调用都可能在同一个过期标记上通过。

同一把锁也覆盖read_file加标记盖印。

这样标记始终哈希的是模型真正看到的那一版。

锁是WeakValueDictionary模式。

和sandbox/file_operation_lock.py相同。

但命名空间是独立的。

工具内部的文件锁只守变异。

这把锁还覆盖变异之前的授权。

锁的scope取thread_id。

没有thread_id就取sandbox_id。

都没有就用global。

异步路径用_acquire_gate_lock。

threading.Lock允许跨线程释放。

所以锁可以在事件循环外获取。

取消路径先清理再传播取消。

### 3、门检查

_check_write_gate是门的核心。

这个方法先读文件当前内容。

FileNotFoundError表示文件不存在。

write_file会创建文件。

所以这种情况放行。

str_replace会自己报错。

其他异常fail open。

日志警告后放行写。

文件内容以"Error:"开头时fail open。

错误字符串读通道分不清"不存在"和"不可读"。

创建继续进行。

真实失败从工具自身浮出。

然后比较最新标记哈希和当前内容哈希。

相等就放行。

不相等就返回阻止的ToolMessage。

阻止消息告诉模型重新读取。

消息还给出具体建议。

比如追加前读最后约30行就够了。

_latest_mark_hash反向扫描消息。

找该路径的最新读取标记。

### 4、标记盖印

_attach_read_mark在成功的read_file结果上盖标记。

错误结果不盖。

标记内容是规范化路径加内容SHA-256。

内容不可哈希时跳过。

Error:前缀读通道也跳过。

写入从不刷新标记。

任何成功写入都会改变文件哈希。

所以写入自动让所有更早的读取失效。

连续两次修改之间必须重新读取。

### 5、载荷省略

wrap_model_call做模型绑定请求的载荷省略。

被阻止的调用是死重量。

调用从没运行。

门要求重新读取加重新调用。

模型无论如何会重新发出内容。

所以省略载荷不会丢信息。

elide_blocked_write_payloads执行省略。

只有省略策略在这里。

一个调用符合条件当且仅当有WRITE_BLOCK_KEY的ToolMessage回答了它。

符合条件的调用载荷字段替换成_ELIDED_PAYLOAD_TEMPLATE。

模板包含字符数和工具名。

模板是确定性的。

同一载荷反复模型调用保持相同请求前缀。

这有利于提示缓存。

表面的逐面改写交给tool_call_args.rewrite_messages_tool_call_args。

改写覆盖结构化tool_calls、原始provider载荷、tool_use块、chunk参数。

改写函数不改输入。

未触及的消息按身份透传。

所以存储的历史保留原始参数。

所以每次模型调用的输出一致。

配对是按发生配对的。

tool-call id可能在多轮之间重复。

历史范围的id集合会误伤同id的成功调用。

所以用id(message)加call_id的组合。

### 6、授权范围

这个中间件拥有组合调用的沙箱授权范围。

wrap_tool_call用sandbox_authorization_scope包裹检查和执行。

SandboxAuthorizationError变成错误ToolMessage。

不fail open。

不中断运行。

_authorization_error_result构造这个错误消息。

消息带status="error"和结构化异常元数据。

## 三、它和谁协作

它在中间件链的位置是外层写门。

它位于ToolProgress和ToolErrorHandling之外。

被阻止的调用不消耗ToolProgress槽位。

阻止结果自己盖deerflow_tool_meta。

结果还携带deerflow_write_block元数据。

标记活在消息上。

压缩删除了读取结果就删除了标记。

门在读取内容离开上下文时永远不能通过。

上游依赖sandbox/tools的read_current_file_content。

这是默认的内容读取器。

上游依赖sandbox/tools的授权scope助手。

上游依赖tool_call_args的pair_tool_call_results和rewrite_messages_tool_call_args。

上游依赖tool_result_meta的normalize_tool_result和stamp_exception_meta。

配置类是ReadBeforeWriteConfig。

省略开关是elide_blocked_payloads。

最小字符数是elide_min_chars。

release_policy_parameters声明完整配置。

## 重要性评级

评级是8分。

理由如下。

这个中间件直接修复了一个真实的重复输出缺陷。

盲写是LLM代理最常见的事故之一。

先读后写是经过验证的工程实践。

这个中间件的设计体现了并发正确性思维。

按线程加路径串行化避免了同轮双写竞态。

标记和锁的覆盖范围保证了哈希对应真实内容。

fail-open方向和错误字符串沙箱的兼容处理都很务实。

所以评8分。

不评更高分的原因是门控范围有限。

只有write_file和str_replace两个工具被门控。

bash可以绕过这个门。

文档自己承认bash路径是替代绕过手段。

不评更低分的原因是它默认开启。

它是文件一致性的主要保障。
