# deerflow.agents.memory-档案

## 一、这个包是干什么的

这个包是DeerFlow的"记忆系统"包。

包名是`deerflow.agents.memory`。源码在`backend/packages/harness/deerflow/agents/memory/`。

大白话讲。智能体要跨对话记住用户。谁负责记、记在哪、怎么取出来，全归这个包管。

这个包的核心设计是"可插拔"。

包文档字符串写得很清楚。这里放共享的、与后端无关的核心。核心是`MemoryManager`契约、`get_memory_manager`单例工厂、`reset_memory_manager`。

后端住在`backends/`下。每个后端自包含，暴露`MANAGER_CLASS`。换后端的方法是放一个`backends/<name>/`文件夹加一行配置。deer-flow其他代码一行都不用改。

有一个重要细节。DeerMem私有的符号（`format_memory_for_injection`、`get_memory_data`、`MemoryUpdater`等）不从包根导出。要用就得直接从`deerflow.agents.memory.backends.deermem.deermem.core.*`导入。

## 二、包里的主要成员

### 1、manager.py

这个模块是记忆系统的"宪法"。

- `MemoryManager`。后端无关的记忆管理器契约。它是pydantic`BaseModel`而不是裸ABC。这样契约免费获得字段校验和序列化。
- `get_memory_manager()`。单例工厂。从`MemoryConfig.manager_class`解析活动后端。
- `reset_memory_manager()`。重置单例。
- `MemoryManagerError`及子类。契约级错误。`MemoryReadError`、`MemoryConflictError`、`MemoryCorruptionError`。

契约方法是分层的。

- 第一层是抽象方法。`add`和`get_context`。每个后端必须实现。写和读注入是后端的根本职责。缺一个就在实例化时报错。
- 第二层是管理方法，带默认实现。`add_nowait`、`search`、`get_memory`、`clear_memory`、`import_memory`、`export_memory`、`delete_memory`、`shutdown_flush`。
- 第三层是可选钩子，带默认实现。`warm`、`reload_memory`、`create_fact`、`delete_fact`、`update_fact`、`on_pre_compress`、`on_turn_start`。

契约还有跨字段不变量校验。`supports_search`标记必须和`search()`是否被重写一致。`mode="tool"`要求后端实现`search`。不一致就在实例化时快速失败。

工厂用扫描机制发现后端。扫描`backends/`下的每个文件夹，找`MANAGER_CLASS`属性。

记忆按`(agent_name, user_id)`分桶。`thread_id`对齐deer-flow对话线程。

单例是进程级的。换后端要重启进程。运行中的进程不会热重载后端代码。

### 2、judging.py

这个模块是记忆判断钩子的共享件。

预筛查和信号分类两个钩子判断同一段文本，构建同样的线上状态，需要同样的答案缓存。这三样东西放在这里，不写三遍。

- `batch_digest()`。批次的身份。对格式化文本做SHA256哈希。用作缓存键和审计标识。
- `conversation_tail_state()`。两个钩子发送的线上状态。只发格式化文本。不发已有记忆、事实ID、工具参数、信号。
- `CachedVerdict`。缓存中的判定。每个答案带服务它的模型标记。

这里故意不放的东西。问题、评分规则、阈值、决策方向、模式、失败策略。这些是各适配器的政策。

### 3、summarization_hook.py

这个模块连接记忆和摘要生命周期。

- `memory_flush_hook(event, pii_redaction_config)`。摘要要移除消息之前触发的钩子。把即将被摘要的消息冲进记忆队列。

这是个薄入口。只有`enabled`加`thread_id`的门和`user_id`解析住在这里。后端做过滤、人工/AI校验、纠正/强化检测。

有一个安全细节。排队负载在这个边界先脱敏。因为压缩马上把这些消息从状态里移除。之后的after-agent脱敏救不回这里排入的原始批次。这是#3190向量5。

### 4、tools.py

这个模块提供工具驱动记忆模式的四个工具。

- `memory_search`。搜记忆。
- `memory_add`。加记忆。
- `memory_update`。改记忆。
- `memory_delete`。删记忆。

当`memory.mode == "tool"`时这些工具注册到智能体上。模型自己决定何时搜索或修改事实。

所有工具走`MemoryManager`抽象。`search`和`get_memory`是二层方法。`create_fact`等是三层钩子。后端不支持时默认抛`NotImplementedError`。工具捕获它返回JSON错误而不是崩溃。

### 5、prescreen/子包

记忆捕获预筛查。可插拔、默认关闭的成本闸门。

- `MODE_OFF`、`MODE_SHADOW`、`MODE_ENFORCE`。三种模式。
- `MemoryPrescreenProvider`。提供者契约。
- `resolve_memory_prescreen()`。解析提供者。

这个钩子住在宿主而不是扩展里。因为扩展API只有只读的事后观察者，它的贡献是fail-open的。对一个能影响写入的开关来说，那是错误的形状。

### 6、signals/子包

记忆信号分类。对一段对话批次给出强化或弱化提示。

- `MemorySignalCoordinator`。协调器。拥有请求组合和组合缓存。
- `build_memory_judge()`。构建判定器。
- `MODE_OFF`、`MODE_SHADOW`、`MODE_HINTS`。模式。

分类器只是提示来源。它从不决定抽取，从不驱动删除。只有一个窄场景（预筛查enforce乘分类器hints）下它能否决一次跳过。

### 7、backends/子包

后端目录。包含deermem、noop、openviking、honcho、mem0五个后端。各有单独档案或在本档案概述。

## 三、它和谁协作

### 1、上游触发者

三个触发者把消息送进记忆。

- `MemoryMiddleware`。after_agent钩子调用`manager.add`。做被动捕获。
- `memory_flush_hook`。摘要前调用`manager.add_nowait`。
- `memory_search`等工具。模型直接调用。

### 2、读取者

- `lead_agent/prompt.py`的`_get_memory_context()`。调用`manager.get_context()`取得注入文本。
- Gateway记忆路由。`app/gateway/routers/memory.py`直接调用`manager`的各方法。
- 内嵌客户端。`deerflow/client.py`调用记忆方法。

### 3、下游

它依赖`deerflow.config.memory_config`读配置。依赖`deerflow.runtime.user_context`解析用户。依赖`deerflow.typesafe.client`做类型安全调用。

### 4、配置

共享配置只有四个字段。`enabled`、`injection_enabled`、`manager_class`、`backend_config`。其余配置是各后端私有的。

### 5、测试

测试非常密集。`test_memory_manager_interface.py`、`test_memory_manager_pluggable.py`、`test_memory_queue.py`、`test_memory_prompt_injection.py`、`test_honcho_memory_backend.py`、`test_mem0_memory_backend.py`、`test_memory_updater.py`等。

## 四、重要性评级

评级是8分。

理由如下。

记忆是产品的核心卖点之一。没有记忆，智能体每次对话都从零开始。

它是可插拔架构的枢纽。`MemoryManager`契约决定所有后端的形状。

它被引用的地方很多。中间件、提示词、Gateway路由、客户端都依赖它。

删除它会怎样。记忆功能整体消失。智能体失去跨对话记忆。但智能体本体还能运行，对话不中断。记忆读取失败默认是fail-open的，说明系统刻意允许记忆缺失。

为什么是8分不是10分。记忆是增强能力，不是存活必需。`enabled: false`一行配置就能完全关闭它。系统没有记忆也能跑。

为什么不是更低分。它有完整的契约层。所有后端都建立在它之上。契约坏了，五个后端一起坏。
