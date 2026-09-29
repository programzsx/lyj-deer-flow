# NoopMemoryManager-档案

## 一、这个类是干什么的

NoopMemoryManager是agents/memory/backends/noop/noop_manager.py里的类。

它继承MemoryManager。

它是功能性空的内存后端。

它存储和recall什么都没有。

with manager_class为noop时系统以空内存跑。

不存储。不注入。每个读返回空。

用途如下。

测试。

不碰enabled就禁用内存。

作为基线。

它证明可插拔机制端到端可用。

工厂、drop-in发现、配置切换。

它也是新后端的模板。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/noop/noop_manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、可移植黄金规则

后端通过恰好两个通道接收所有宿主信息。

ABC方法参数。

backend_config字典。

后端文件夹唯一允许的from deerflow导入是ABC契约行。

改那一行就能把后端移植到另一个agent。

不导入deer-flow路径助手、配置单例或模型。

### 2、NoopMemoryManager本身

_config是PrivateAttr。解析backend_config纯为演示模式。

noop忽略每个字段。真后端用self._config的旋钮。

supports_search为True。

noop覆盖search返回空列表。

它的设计是存取皆空。每个读返回空。永不抛。

标志True匹配覆盖。不变量要求标志等于覆盖。

### 3、写入和读取

add和add_nowait返回None。

get_context返回空字符串。

search返回空列表。

### 4、管理操作

get_memory返回最小空形状。{"facts": []}。

宿主网关填version、lastUpdated、user、history默认值。

真后端返回能cast成DeerMem形状的字典。

clear_memory和import_memory返回空形状。

delete_memory和export_memory继承基类tier-2默认raise。

死契约。零调用方。noop不覆盖。

### 5、生命周期

shutdown_flush返回True。

什么都没排队。关闭排空是干净的no-op成功。

fact CRUD和reload继承默认raise NotImplementedError。

调用方抓住后走501或回退。

### 6、NoopConfig模板

config.py是解析backend_config的模板。

后端声明自己的旋钮。在from_backend_config里解析。

storage_path是宿主注入的可写状态目录。

should_keep_hidden_message是宿主注入钩子示例。

from_backend_config只读已知键。

未知键忽略。

宿主能安全给每个后端注入storage_path。

不打断不使用它的后端。

### 7、写新后端的步骤

复制这个文件夹到backends/<yourname>/。

config.py声明旋钮加from_backend_config。

manager.py改名类。声明PrivateAttr依赖。

model_post_init解析backend_config。

实现ABC方法。

可选覆盖tier-3钩子。

__init__.py设置MANAGER_CLASS。

config.yaml设manager_class。

## 三、它和谁协作

- MemoryManager是基类契约。
- NoopConfig是配置模板。
- 工厂get_memory_manager解析到它。

## 四、重要性评级

评级是4分。

理由如下。

这个类是空实现。

它的价值是证明可插拔机制。

它是新后端的模板。

可移植黄金规则文档化得很完整。

返回形状说明帮助真后端对齐。

这些有价值。

扣掉6分。

扣分原因是它什么都不做。
