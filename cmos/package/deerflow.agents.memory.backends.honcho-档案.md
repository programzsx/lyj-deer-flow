# deerflow.agents.memory.backends.honcho-档案

## 一、这个包是干什么的

这个包是DeerFlow的"Honcho记忆后端"包。

包名是`deerflow.agents.memory.backends.honcho`。源码在`backend/packages/harness/deerflow/agents/memory/backends/honcho/`。

大白话讲。记忆系统的契约允许换后端。这个包把记忆存到Honcho服务里。Honcho是一个独立的记忆服务，可以是自建的，也可以是托管的。

这个后端的定位写在README里。Honcho覆盖记忆的"用户维度"。长期用户建模、用户偏好、跨会话工作表示。它和项目/任务导向的后端（比如DeerMem）互补。

这个后端本地不做LLM调用。

消息写入是廉价的普通写。事实提取和表示构建由Honcho自己的服务端deriver异步完成。所以这个后端的网关进程里没有LLM开销。

## 二、包里的主要成员

### 1、__init__.py

它只做一件事。从`honcho_manager`导入`HonchoMemoryManager`，暴露`MANAGER_CLASS = HonchoMemoryManager`。

### 2、honcho_manager.py

这个模块是后端管理器。`HonchoMemoryManager`类继承`MemoryManager`。

核心方法：

- `add()`。写入。把对话消息写进Honcho会话。写入是"发了就忘"。失败的写入记日志后丢弃。本地不缓存。所以`shutdown_flush`是空操作。
- `get_context()`。读注入文本。无查询的召回。取用户的工作表示（最多25条结论）。截断到`max_injection_chars`注入。
- `search()`。查询感知的搜索。用Honcho的workspace级搜索。
- `get_memory()`。取一个最小DeerMem形状的文档。工作表示放在`workContext`摘要里。事实列表为空。
- `shutdown_flush()`。空操作。因为没有本地缓冲。
- `aadd()`、`aget_context()`、`asearch()`。异步方法。

一个重要的多用户隔离设计。

每个操作从`user_id`解析workspace。先查`workspace_overrides`精确匹配。匹配不到就用`workspace_prefix`加稳定ID。

稳定ID是清洗后的user_id加8个十六进制字符的SHA-256后缀。

为什么加哈希后缀。清洗是有损的。清洗会把非`[a-zA-Z0-9_-]`字符串折叠成一个`-`。两个不同的原始ID可能清洗成同一个。`user.name@x`和`user-name@x`都清洗成`user-name-x`。直接用清洗后的形式会让两个人的记忆合并进一个workspace。哈希后缀让默认路径抗碰撞。

缺失或空的`user_id`会怎样。fail closed。写变成空操作。读返回空。永远没有共享后备workspace。

`agent_name`不做映射。Honcho建模的是用户，不是每个agent的事实。

错误处理。`failure_policy.read: fail_open`（默认）记日志后继续。`fail_closed`会把后端错误传播过提示词构建并中止运行。

### 3、client.py

这个模块是最小的同步Honcho v3 HTTP客户端。

- `HonchoClient`。客户端本体。用httpx直接调v3 REST API。
- `HonchoRequestError`。请求失败错误。

客户端方法：

- `get_or_create_peer()`。取或建peer。
- `get_or_create_session()`。取或建会话。
- `set_session_peers()`。设置会话的peers。
- `add_messages()`。写消息。
- `working_representation()`。取工作表示。
- `search()`。搜索。

设计要点。peers和会话是服务端取或建的。所以这里的每个调用都是幂等的。用httpx而不是官方`honcho-ai`SDK。这是刻意的轻依赖选择。将来换官方SDK是可能的后续，对应OpenViking从自写HTTP到官方适配器的路线。

`transport`参数存在的原因。测试可以注入`httpx.MockTransport`。这是mem0客户端的先例。

### 4、config.py

这个模块定义Honcho配置。`HonchoConfig`。

- `base_url`。Honcho服务地址。
- `api_key`。托管Honcho的密钥。
- `workspace_prefix`。workspace前缀。默认每个用户ID一个隔离workspace。
- `workspace_overrides`。把特定user_id映射到自定义workspace。
- `user_peer_overrides`。把特定user_id映射到自定义peer名。
- `assistant_peer`。助手的peer名。
- `message_char_limit`、`max_injection_chars`。长度限制。
- `timeout_seconds`、`connect_timeout_seconds`。超时。
- `failure_policy`。读失败策略。
- `allow_insecure_http`。允许明文HTTP。

安全守卫。配了`api_key`又用明文`http://`地址，启动时会被拒绝。除非显式设`allow_insecure_http: true`。这是本地开发的可选项。任何非本地部署应该用HTTPS。

`allow_insecure_http`接受布尔值。Pydantic的布尔词表大小写不敏感。`true`、`t`、`y`、`yes`、`on`、`1`开启。`false`、`f`、`n`、`no`、`off`、`0`关闭。其他值在加载配置时被拒绝。这样拼错一个词不会静默开启明文选项。

配置错误在Gateway启动时就快速失败。连接性故意不探测。临时不可达的Honcho不会阻塞启动。读取之后按`failure_policy.read`退化。

### 5、异步执行

README说明了异步边界的行为。

Honcho HTTP客户端是同步的。这是为了兼容`MemoryManager`契约。DeerFlow在每个异步边界用`asyncio.to_thread`卸载它。也就是管理器的`a*`方法。慢的Honcho请求永远不会阻塞ASGI处理器或SSE心跳。

### 6、限制

README明确列出了限制。

- 没有DeerMem风格的事实CRUD。`create_fact`等返回明确的不支持错误。
- 不迁移已有DeerMem数据。
- 写入至多一次。失败即丢。
- `agent_name`不映射。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.memory.manager`。契约与工厂。工厂扫描到`MANAGER_CLASS`。
- `MemoryMiddleware`。被动写入时调用`add()`。README说tool模式下被动写中间件保留。因为Honcho的deriver从`add()`写入中学习。
- `lead_agent/prompt.py`。调用`get_context()`注入用户表示。
- `memory_search`工具。调用`search()`。

### 2、下游

- Honcho服务本身。通过HTTP对接。
- httpx。HTTP库。

### 3、可移植性

这个后端遵守可移植性黄金规则。它唯一的`from deerflow`导入是契约那一行。

```python
from deerflow.agents.memory.manager import MemoryManager, MemoryManagerError, MemoryReadError
```

其他一切都从`backend_config`来。

### 4、测试

`tests/test_honcho_memory_backend.py`测试这个后端。客户端的`transport`参数让测试可以注入mock传输。

## 四、重要性评级

评级是4分。

理由如下。

这个包是可选后端。默认后端是DeerMem。不配置`manager_class: honcho`时，这个包完全不参与运行。

它的代码量小。总共约3万字节。四个代码文件。

它被引用的地方极少。只有工厂扫描机制和测试引用它。

删除它会怎样。默认配置下什么都不会变。只有显式配置`manager_class: honcho`的部署会启动失败。改回deermem就恢复。

为什么是4分不是更低分。它是一个完整的、有质量的后端实现。多用户隔离设计（哈希后缀抗碰撞）很用心。它演示了"加一个远程后端"的完整样板。

为什么不是更高分。它不在核心路径上。不配置就不运行。它服务的是"想用Honcho存记忆"这个小众需求。
