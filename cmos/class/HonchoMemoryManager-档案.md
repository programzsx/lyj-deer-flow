# HonchoMemoryManager-档案

## 一、这个类是干什么的

HonchoMemoryManager是agents/memory/backends/honcho/honcho_manager.py里的类。

它继承MemoryManager。

它是由Honcho v3实例支撑的内存后端。

自托管或托管。

定位如下。

Honcho覆盖内存的用户维度。

长期用户建模、偏好、跨会话工作表示。

补充面向项目或任务的后端。

ingestion便宜。纯消息写入。

Honcho自己的server端deriver异步执行事实提取和表示构建。

所以这个后端不做LLM调用。

supports_search为True。

requires_passive_writes_in_tool_mode为True。

tool mode必须保留被动写入。

持续喂deriver。

search提供tool mode期望的query感知检索。

和mem0_manager.py的理由相同。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/honcho/honcho_manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、身份解析

_workspace从user_id解析workspace。

workspace_overrides精确匹配优先。

否则用workspace_prefix加_stable_id。

_stable_id在sanitize_id输出上加8位十六进制SHA-256后缀。

sanitize_id单独是有损的。

它把所有非[a-zA-Z0-9_-]字符压缩成单个-。

不同的原始id可能碰撞。

user.name@x和user-name@x都sanitize成user-name-x。

裸用有损形式会静默合并两个人的内存。

哈希后缀让默认路径抗碰撞。同时保持可读。

workspace_overrides和user_peer_overrides按原始未sanitize的键匹配。

缺失user_id时fail closed。

调用变成no-op或空读。永不共享回退workspace。

session id复用同样推导。df-加_stable_id(thread_id)。

裸sanitize_id会把t.1和t-1合并成一个Honcho会话。

### 2、共享workspace语义

workspace_overrides条目跨用户共享时故意共享workspace。

get_context和get_memory在那里保持peer作用域。

search用Honcho的workspace作用域/search。没有peer filter。

那些用户共享一个搜索索引。

### 3、add方法

add写消息。

无可用user时跳过写。

human消息给user_peer。

ai消息给assistant_peer。

内容截断到message_char_limit。

先get_or_create peer和session。

再set_session_peers。

最后add_messages。

写失败时警告。不抛。

### 4、读门

_read_or_fallback是每个recall路径的单个failure_policy.read门。

fail-open默认日志并返回fallback。

fail_closed包装成MemoryReadError。

宽except Exception是包含边界。

没有客户端异常能逃进MemoryMiddleware.after_agent。

### 5、get_context和search和get_memory

get_context返回working_representation。截断到max_injection_chars。

search返回搜索结果。带content、session_id、peer_id等。

get_memory返回最小DeerMem形状视图。

representation作为work-context summary。

Honcho没有DeerMem风格fact CRUD。

网关用默认填缺失字段。和noop后端的{"facts": []}相同契约。

### 6、HonchoClient

client.py是最小同步Honcho v3 HTTP客户端。

刻意轻依赖。httpx直接打v3 REST API。

peers和sessions是server端get-or-create。

所以每个调用都是幂等的。

HonchoRequestError表示API调用失败。

支持注入transport供测试用MockTransport。

### 7、异步offload

aadd、aget_context、asearch都通过asyncio.to_thread offload。

阻塞IO门。httpx永远不在事件循环上跑。

### 8、其他

from_config时配置错误fail fast。

连接性故意不探测。

暂时不可达的Honcho不能阻塞Gateway启动。

读按failure_policy.read降级。

shutdown_flush返回True。写是同步per-call。本地无缓冲。

close释放HTTP客户端。

## 三、它和谁协作

- MemoryManager是基类契约。
- HonchoClient是HTTP传输层。
- HonchoConfig提供配置解析和sanitize_id。
- MemoryMiddleware和memory_search工具消费它。

## 四、重要性评级

评级是6分。

理由如下。

这个类是Honcho内存后端的完整实现。

多用户隔离的身份解析是核心。

_stable_id的哈希后缀防止有损sanitize碰撞。

缺失user_id时fail closed。

读门统一处理fail-open和fail_closed。

异步offload不阻塞事件循环。

这些质量高。

扣掉4分。

扣分原因是它是可选外部后端。
