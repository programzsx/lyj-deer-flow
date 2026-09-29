# deerflow.agents.memory.backends.mem0-档案

## 一、这个包是干什么的

这个包是DeerFlow的"mem0记忆后端"包。

包名是`deerflow.agents.memory.backends.mem0`。源码在`backend/packages/harness/deerflow/agents/memory/backends/mem0/`。

大白话讲。记忆系统的契约允许换后端。这个包把记忆存到mem0平台里。mem0可以是官方托管服务，也可以是任何API兼容的自建服务。

这个后端最大的特点是"进程内完全无状态"。

去重、事实提取、存储全部在mem0服务端完成。本地的Gateway进程里不保留队列、水位线、缓存。因为状态不在本地，这个后端可以安全地跑在多worker的Gateway部署里。

消息写入是廉价的普通写。事实提取由mem0服务端异步完成。所以这个后端的网关进程里没有LLM开销。

## 二、包里的主要成员

### 1、__init__.py

它只做一件事。从`mem0_manager`导入`Mem0Manager`，暴露`MANAGER_CLASS = Mem0Manager`。

工厂的`_scan_backends`扫描到文件夹名`mem0`，就发现这个类。文件夹名等于后端名等于配置里的`manager_class: mem0`。

### 2、mem0_manager.py

这个模块是后端管理器。`Mem0Manager`类继承`MemoryManager`。

两个类级标记：

- `supports_search = True`。因为这个类重写了`search()`。契约要求标记和重写一致。
- `requires_passive_writes_in_tool_mode = True`。mem0靠`add()`从完整对话里提取事实。所以tool模式下被动写中间件保留。模型得到了查询感知的`memory_search`，新对话照样积累记忆。

核心方法：

- `add()`。写入。先用过滤器筛消息，再提交给mem0做服务端提取。提交是"发了就忘"。mem0异步处理，响应里的`event_id`不被轮询。`thread_id`映射到mem0的`run_id`，永远满足mem0"至少一个实体ID"的要求。
- `get_context()`。读注入文本。这是"无查询召回"。这个后端忽略可选的`query`提示，直接取桶里最近的`top_k`条记忆。注入文本按"条目边界"截断。放不下一整条的记忆被跳过，注入永远不会以半条记忆结尾。配置的预算比最短记忆还小时，返回空文本并记警告。
- `search()`。查询感知的搜索。支持可选的`category`过滤。结果映射成后端中立的事实形状。
- `get_memory()`、`export_memory()`。列出桶里全部记忆，映射成事实形状。
- `clear_memory()`、`delete_memory()`。清空桶。不传`agent_name`就清空用户全部记忆。
- `close()`。释放底层HTTP连接池。

一个明确不支持的东西。事实CRUD（`create_fact`等）故意不实现。Gateway返回501。

身份映射是一对一的。`(user_id, agent_name)`映射到mem0的`(user_id, agent_id)`。`thread_id`映射到mem0的`run_id`。

错误处理分三套策略。

- 读失败。`read_policy: fail_open`（默认）记警告后注入空文本继续。`fail_closed`抛`MemoryReadError`，错误传播过提示词构建并中止运行。
- 写失败。`write_policy: log_and_drop`（默认）记警告后丢弃，写入是"至多一次"。`raise`抛`MemoryManagerError`。
- 启动策略。`startup_policy: fail_fast`（默认）在`from_config`里用`ping()`验证API密钥。`tolerate`推迟到首次使用时才发现问题。

`read_failures_are_fatal_for_config()`类方法向宿主声明读失败策略。动态上下文中间件在注入超时边界用它决定退化方式。

### 3、client.py

这个模块是mem0 REST API的同步HTTP客户端。

- `Mem0Client`。客户端本体。用httpx直接调API。v3端点负责增、搜、列。v1端点负责删除。
- `Mem0APIError`。任何请求失败错误。
- `Mem0AuthError`。401错误，提示检查API密钥。

客户端方法：

- `add_memories()`。提交消息做服务端提取。
- `search_memories()`。带查询、过滤器、`top_k`、阈值的搜索。
- `list_memories()`。跨页列出记忆，直到取完或达到`max_items`。
- `delete_all_memories()`。按身份清空。
- `ping()`。启动时的鉴权检查。用一个哨兵用户ID列1条记忆。这个哨兵桶永远是空的。所以这个检查证明了密钥可用，又不碰真实数据。

`transport`参数存在的原因。测试可以注入`httpx.MockTransport`。

### 4、config.py

这个模块定义mem0配置。`Mem0Config`。

- `api_key_env`。存API密钥的环境变量名。默认`MEM0_API_KEY`。密钥本身永远不出现在config.yaml里。
- `base_url`。mem0平台API地址。指向自建服务器就能本地部署。
- `allow_insecure_http`。允许明文HTTP发令牌。只用于可信的本地开发网络。
- `top_k`。注入和默认搜索宽度。默认8。范围1到1000。
- `score_threshold`。搜索的最低相关分。默认0.1。
- `max_injection_chars`。注入文本的硬上限。默认12000。
- `timeout_seconds`。每请求超时。默认10秒。
- `startup_policy`、`read_policy`、`write_policy`。三套失败策略。

校验规则很严格。

宿主工厂会往每个后端的`backend_config`里注入`storage_path`和`should_keep_hidden_message`。这两个键被接受并忽略。任何其他未知键直接拒绝。原因写在文档字符串里。持久化配置里的拼写错误必须快速失败，不能静默退回默认值。

数值键有专门的`_number`读取器。YAML里`top_k:`后面什么都不写，读进来就是`None`。这个值保持默认，而不是让`int(None)`在构造深处抛一个不指出键名的错误。不能转换的值被报成配置错误。数字字符串照样能用，因为`int`和`float`本来就接受它们。

安全守卫。`base_url`必须用HTTPS。因为每个请求都带着API密钥。只有显式设`allow_insecure_http: true`才允许明文HTTP。

### 5、message_filtering.py

这个模块是写路径的消息过滤。

它保持的：可见的用户输入、格式正确的人工澄清回答、最终的AI回复。

它丢弃的：框架内部的`hide_from_ui`消息、带工具调用的AI消息、工具输出、空轮次、只有上传块的轮次。

一个重要的设计决定写在文档字符串里。这些规则是DeerMem`filter_messages_for_memory`的"自包含镜像"。可移植性规则禁止跨后端文件夹导入。所以逻辑是复制的，不是共享的。

澄清回答的识别是结构化检查。隐藏消息的`additional_kwargs`里要有`human_input_response`映射。版本是1，kind对，来源、请求ID、值都非空。文本回答直接通过。选项回答还要有`option_id`。

`extract_message_text()`处理两种消息内容。纯字符串直接返回。内容块列表只取文本部分。

上传块用正则剥掉。剥完剩下的文本为空，说明这是"只有上传的轮次"。这个轮次后面跟着的AI确认消息也没有用户内容。所以用`skip_next_ai`标记把它一并跳过。

### 6、异步执行

README说明了异步边界的行为。

mem0 HTTP客户端是同步的。这是为了兼容`MemoryManager`契约。DeerFlow在每个异步边界卸载它。异步中间件用管理器的`a*`方法（内部是`asyncio.to_thread`）。Gateway记忆路由在工作线程里跑同步管理调用。所以慢的mem0请求不会阻塞无关的ASGI处理器或SSE心跳。

### 7、限制

README明确列出了限制。

- `mode: middleware`下的召回是无查询的。要查询感知的语义召回就用`mode: tool`。
- 事实CRUD、`import_memory`、设置页记忆编辑都没实现。Gateway返回501。DeerMem仍是默认后端。
- 不迁移已有DeerMem数据。
- `log_and_drop`写策略是"至多一次"。失败的写入被丢弃。
- `memory_add`等工具依赖事实CRUD。这个后端没实现。它们返回明确的不支持错误。对话写入照样通过保留的中间件发生。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.memory.manager`。契约与工厂。工厂扫描到`MANAGER_CLASS`。
- `MemoryMiddleware`。被动写入时调用`add()`。这个后端设置了`requires_passive_writes_in_tool_mode = True`，所以tool模式下被动写中间件保留。
- `lead_agent/prompt.py`。调用`get_context()`注入记忆。
- `memory_search`工具。调用`search()`。
- Gateway记忆路由。调用`get_memory()`等管理方法。

### 2、下游

- mem0平台本身。通过HTTP对接。可以是托管服务或自建服务。
- httpx。HTTP库。

### 3、可移植性

这个后端遵守可移植性黄金规则。它唯一的`from deerflow`导入是契约那一行。

```python
from deerflow.agents.memory.manager import MemoryManager, MemoryManagerError, MemoryReadError
```

其他一切都从`backend_config`和环境变量来。

### 4、测试

`backend/tests/test_mem0_memory_backend.py`测试这个后端。它导入`Mem0Client`、`Mem0Config`、`Mem0Manager`和消息过滤函数。测试还通过补丁替换`Mem0Client`。客户端的`transport`参数让测试可以注入mock传输。

## 四、重要性评级

评级是4分。

理由如下。

这个包是可选后端。默认后端是DeerMem。不配置`manager_class: mem0`时，这个包完全不参与运行。

它的代码量中等。五个文件。四个代码文件加一个README。

它被引用的地方极少。用Grep在全仓库搜`deerflow.agents.memory.backends.mem0`。排除清单文件后，只有测试文件`backend/tests/test_mem0_memory_backend.py`引用它。运行时引用靠工厂的文件夹扫描机制，代码里没有别的模块直接导入它。

删除它会怎样。默认配置下什么都不会变。只有显式配置`manager_class: mem0`的部署会启动失败。改回deermem就恢复。

为什么是4分不是更低分。它是一个完整的、质量高的后端实现。条目边界截断、哨兵用户ID的启动鉴权、消息过滤的澄清回答识别，这些细节都很用心。它和honcho后端一起演示了"加一个远程后端"的完整样板。

为什么不是更高分。它不在核心路径上。不配置就不运行。它服务的是"想用mem0平台存记忆"这个小众需求。
