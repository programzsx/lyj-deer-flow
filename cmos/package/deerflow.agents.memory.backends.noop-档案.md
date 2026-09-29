# deerflow.agents.memory.backends.noop-档案

## 一、这个包是干什么的

这个包是DeerFlow的"noop记忆后端"包。

包名是`deerflow.agents.memory.backends.noop`。源码在`backend/packages/harness/deerflow/agents/memory/backends/noop/`。

大白话讲。这个后端什么也不存，什么也不取。配上它之后，系统带着一个空记忆运行。写入是空操作。注入是空字符串。每次读都返回空。

它有两个身份。

第一个身份是"可插拔机制的证明"。工厂扫描、文件夹投放、配置切换，这条链路端到端靠它验证。配上`manager_class: noop`，系统就能用空记忆跑起来。

第二个身份是"新后端的模板"。想写一个新后端，就复制这个文件夹，改名，填自己的逻辑。它的文档字符串写了完整的六步教程。

它还有一个实际用途。想禁用记忆又不想动`enabled`开关时，配`manager_class: noop`就行。测试和基线也用它。

## 二、包里的主要成员

### 1、__init__.py

它只做一件事。从`noop_manager`导入`NoopMemoryManager`，暴露`MANAGER_CLASS = NoopMemoryManager`。

工厂的`_scan_backends`扫描到文件夹名`noop`，就发现这个类。

### 2、noop_manager.py

这个模块是后端管理器。`NoopMemoryManager`类继承`MemoryManager`。

这个模块的最大价值在文档字符串里。文档字符串写了"怎么写一个新后端"的完整步骤。

- 第一步。复制这个文件夹到`backends/<你的名字>/`。
- 第二步。改`config.py`。声明自己的配置项，写`from_backend_config`。从`backend_config`读`storage_path`，不要从deer-flow读。
- 第三步。改管理器。改类名，用`PrivateAttr`声明依赖，`model_post_init`解析配置，实现契约方法。
- 第四步。可选。按需重写三层钩子（`create_fact`等）。钩子有基类默认值。不支持的可以不重写，调用方会捕获`NotImplementedError`。
- 第五步。改`__init__.py`。设置`MANAGER_CLASS`。
- 第六步。改config.yaml。`manager_class: <你的名字>`。

文档字符串还写了一个"返回形状"的注意事项。宿主Gateway把`get_memory`等方法的返回值转换成DeerMem形状的响应（`version`、`lastUpdated`、`user`、`history`、`facts[]`）。真实的后端要把自己的原生记录映射进这个形状。noop返回最小的`{"facts": []}`，Gateway用默认值补齐其余字段。

核心方法全部是最小实现：

- `add()`、`add_nowait()`。返回`None`。什么也不存。
- `get_context()`。返回空字符串。
- `search()`。返回空列表。
- `get_memory()`、`clear_memory()`、`import_memory()`。返回空记忆文档。
- `shutdown_flush()`。返回`True`。因为从来没有排过队，关闭冲刷是干净的成功。

一个刻意的决定。`delete_memory()`和`export_memory()`不重写。它们继承基类的默认实现，抛`NotImplementedError`。注释说明这是一个死契约（零个调用方）。noop不需要覆盖它们。

`supports_search = True`。原因写在注释里。noop重写了`search()`返回空列表。这是它"什么都不取"的设计。每次读返回空，从不抛错。契约的不变量要求标记和重写一致。所以标记是True。

`model_post_init`解析`backend_config`成`NoopConfig`。注释说明这纯粹是为了演示模式。noop忽略每个字段。

### 3、config.py

这个模块定义noop配置。`NoopConfig`。

这个模块的真正价值也是文档字符串。它写了"可移植性黄金规则"的完整版本。

规则的内容。后端接收宿主信息的渠道只有两个。

- 第一个渠道。`MemoryManager`契约方法的参数。包括`user_id`、`agent_name`、`thread_id`、`messages`等。
- 第二个渠道。传给`__init__`的`backend_config`字典。

后端禁止导入deer-flow模块。禁止硬编码deer-flow路径。整个后端文件夹里唯一允许的`from deerflow`导入，是管理器里那行ABC契约导入。

```python
from deerflow.agents.memory.manager import MemoryManager
```

这一行把后端绑到宿主上。换宿主时只改这一行。其他一切（存储根、模型、钩子）都从`backend_config`来。

文档字符串还写了工厂给每个后端提供什么。

- `backend_config["storage_path"]`。一个可写的状态目录。真正的后端把存储放在这下面。不要自己调deer-flow的路径帮助函数。
- 宿主钩子。`callbacks`、`should_keep_hidden_message`、`trace_context_manager`、`host_llm_factory`。这些以`from_config`关键字参数的形式传入，不在`backend_config`里。后端用得上就用，用不上就忽略。
- 用户config.yaml里`memory.backend_config`的键。这是后端自己的配置项。

`NoopConfig`的字段是示例性质的。`storage_path`是宿主注入的。`example_option`是示例的私有配置项。`should_keep_hidden_message`是可选的宿主钩子示例。

`from_backend_config`只读已知的键。未知键被忽略。这样宿主可以安全地给每个后端注入`storage_path`，而不用破坏不使用它的后端。

注意。noop的配置解析忽略未知键。mem0的配置解析拒绝未知键。两者是不同的模板选择。文档字符串解释了noop选择忽略的原因。真正的持久化后端（比如mem0）应该拒绝，因为拼写错误必须快速失败。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.memory.manager`。契约与工厂。工厂扫描到`MANAGER_CLASS`。
- `MemoryMiddleware`。被动写入时调用`add()`。add是空操作，所以写入被无声吸收。
- `lead_agent/prompt.py`。调用`get_context()`。拿到空字符串，注入块为空。
- Gateway记忆路由。调用`get_memory()`等方法。拿到空记忆文档。

### 2、下游

没有下游。它不依赖任何存储、服务或HTTP库。这正是它的设计。零依赖让它成为最安全的后端。

### 3、可移植性

它就是可移植性黄金规则的"标准答案"。唯一的`from deerflow`导入是契约那一行。

```python
from deerflow.agents.memory.manager import MemoryManager
```

### 4、测试

`backend/tests/test_memory_manager_pluggable.py`测试它。测试用`NoopMemoryManager`验证工厂的解析机制。测试同时用点号路径和冒号路径两种类路径形式解析它。

## 四、重要性评级

评级是3分。

理由如下。

这个包是可选后端。默认后端是DeerMem。不配置`manager_class: noop`时，这个包完全不参与运行。

它的代码量很小。三个文件。两个代码文件加一个包入口。

它被引用的地方极少。用Grep在全仓库搜`deerflow.agents.memory.backends.noop`。排除清单文件后，只有测试文件`backend/tests/test_memory_manager_pluggable.py`和`.test_durations`缓存引用它。运行时引用靠工厂的文件夹扫描机制，代码里没有别的模块直接导入它。

删除它会怎样。默认配置下什么都不会变。只有显式配置`manager_class: noop`的部署会启动失败。改成别的后端就恢复。

为什么是3分不是更低分。它的运行价值很低，但它的教学价值很高。它是可插拔机制的端到端证明。它的文档字符串是"可移植性黄金规则"的最完整表述。新后端的作者都要从它开始。删掉它，工厂机制的验证和后端模板就同时消失。

为什么不是更高分。它不在核心路径上。不配置就不运行。它不服务任何生产功能。
