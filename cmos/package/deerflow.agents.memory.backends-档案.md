# deerflow.agents.memory.backends-档案

## 一、这个包是干什么的

这个包是DeerFlow记忆系统的"后端集合"包。

包名是`deerflow.agents.memory.backends`。源码在`backend/packages/harness/deerflow/agents/memory/backends/`。

大白话讲。记忆系统说"谁能存记忆"。这个包回答"记忆实际存在哪"。

这个包是一个纯聚合目录。它自己几乎没有代码。真正的成员是各后端子包。

这个包定义了"即插即用"契约。

包文档字符串写得很清楚。每个子包是一个自包含的后端。每个后端在自己的`__init__`里暴露`MANAGER_CLASS`（一个`MemoryManager`子类）。

即插即用契约是三样东西相等。文件夹名等于后端名等于`MemoryConfig.manager_class`的值。

加一个新后端的方法。在`backends/`下放一个新文件夹，在`config.yaml`里设`manager_class: <name>`。deer-flow其他代码零改动。

## 二、包里的主要成员

### 1、__init__.py

只有一段文档字符串。没有代码逻辑。它声明即插即用契约。

### 2、deermem/子包

默认后端。deer-flow自己的记忆系统。结构化事实加JSON存储。功能最全。

- 它实现fact CRUD。
- 它支持FTS5检索。
- 它支持模式为tool。
- 它支持容量淘汰策略。

### 3、noop/子包

空后端。它是模板。想加新后端就复制它。

- 它的第一层抽象方法实现为空操作和空字符串。
- 它不存任何东西。
- 它用于完全关闭记忆但仍满足契约的场景。

### 4、honcho/子包

可选的远程后端。用HTTP对接Honcho（v3 API）。

- Honcho负责用户维度的记忆。长期用户建模、偏好、跨会话工作表示。
- Honcho自己的服务端deriver构建表示。这个后端本地不做LLM调用。
- 写入是廉价的普通消息写。
- 每个用户一个隔离workspace。

### 5、openviking/子包

可选的远程后端。用官方`langchain-openviking`包。单用户中间件模式。

### 6、mem0/子包

可选的远程后端。对接mem0记忆服务。

- `client.py`。mem0客户端。
- `config.py`。配置。
- `mem0_manager.py`。管理器实现。
- `message_filtering.py`。消息过滤。

### 7、README.md

这个目录有一份详尽的README。它告诉开发者换后端、加后端、改后端时该动哪些文件。

README里最重要的规则是可移植性黄金法则。

后端只通过两个通道与宿主对话。第一个通道是抽象方法参数（`manager.py`）。第二个通道是`backend_config`字典。后端文件夹里唯一允许的`from deerflow`导入是契约那一行。

```python
from deerflow.agents.memory.manager import MemoryManager
```

改这一行（且只改这一行）就能把后端移植到另一个智能体。不许导入deer-flow的路径助手、配置单例或模型。

README还有一个关键契约。返回形状。

`get_memory`等管理方法返回的字典，Gateway会转换成DeerMem形状（`MemoryResponse`：`version`/`lastUpdated`/`user`/`history`/`facts[]`）。后端必须返回这个形状能接受的字典。否则数据被静默丢弃，前端日期格式化还会崩。

原因是Gateway和前端目前硬编码为DeerMem形状。

## 三、它和谁协作

### 1、上游

`deerflow.agents.memory.manager`是唯一上游。

工厂的`_scan_backends()`扫描这个目录。按文件夹名发现后端类。

`deerflow.agents.memory.__init__`引用这个目录下的deermem路径来说明私有符号位置。

### 2、下游

各后端有自己的依赖。

- deermem几乎零外部依赖。它自带路径解析、LLM构建。
- honcho依赖httpx。
- mem0依赖mem0库。
- openviking依赖langchain-openviking。

### 3、宿主提供的钩子

工厂调用`cls.from_config(backend_config, mode=cfg.mode, **host_hooks)`。

宿主提供的钩子有：

- `backend_config["storage_path"]`。可写状态目录。宿主的runtime_home默认值。
- `callbacks`。可观测性。记忆LLM调用进langfuse。
- `should_keep_hidden_message`、`trace_context_manager`、`host_llm_factory`。其他宿主钩子。

每个后端的`from_config`只消费自己需要的钩子。

### 4、测试

`test_honcho_memory_backend.py`、`test_mem0_memory_backend.py`、`test_memory_manager_pluggable.py`测试各后端。

## 四、重要性评级

评级是6分。

理由如下。

这个包本身只是目录加文档。真正的逻辑全在子包里。所以本包的分数主要反映"聚合层"的价值。

它的价值在于契约声明。文件夹名即后端名即配置值。这个约定让加后端变成纯增量操作。

删除它会怎样。删除整个目录等于删除全部五个后端。记忆功能彻底失效。只删除`__init__.py`几乎没有影响，因为扫描机制找的是子包的`MANAGER_CLASS`。

为什么是6分。它是记忆子系统的容器层。默认后端deermem被硬依赖，但deermem有自己的档案和自己的分数。聚合层本身被引用极少。

为什么不是更低分。它是可插拔架构的入口约定。约定丢了，加后端的模式就乱了。
