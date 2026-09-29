# deerflow.agents.memory包档案

## 一、这个模块是干什么的

deerflow.agents.memory包是可插拔记忆系统的包门面。

源文件是backend/packages/harness/deerflow/agents/memory/__init__.py。

它的角色是共享核心的门面。

它只暴露后端无关的共享契约。

它不暴露任何具体后端的私有符号。

docstring完整说明了包的架构。

共享核心是MemoryManager契约、get_memory_manager单例工厂、reset_memory_manager。

后端在backends子包下。

每个后端自包含。

每个后端暴露MANAGER_CLASS。

默认后端是DeerMem。

DeerMem的功能模块在backends/deermem/core/下。

换后端的方式是放一个backends/<名字>/文件夹加设置MemoryConfig.manager_class。

deer-flow其他代码不用改。

docstring还明确声明了不重导出的名单。

名单包括format_memory_for_injection、get_memory_data、MemoryUpdater、FileMemoryStorage。

这些是DeerMem私有符号。

调用方必须直接从deerflow.agents.memory.backends.deermem.deermem.core.*导入。

## 二、模块里的主要成员

它从manager模块导入九个成员。

成员是MemoryManager、MemoryManagerError、MemoryReadError、MemoryConflictError、MemoryCorruptionError、get_memory_manager、memory_read_failures_are_fatal、reset_memory_manager。

MemoryManager是全部后端的抽象契约。

MemoryManagerError是错误基类。

MemoryReadError、MemoryConflictError、MemoryCorruptionError是具体错误。

get_memory_manager是单例工厂。

reset_memory_manager用于测试和重置。

memory_read_failures_are_fatal暴露读失败策略。

全部在__all__里。

门面没有导入任何后端。

后端导入延迟到工厂扫描时。

这是门面层面的懒加载。

## 三、它和谁协作

它向内依赖manager模块。

它向外被memory_middleware和记忆工具消费。

它下面挂着backends、prescreen、signals三个子包。

backends子包含deermem、honcho、mem0、noop、openviking五个后端。

prescreen子包提供写入预筛。

signals子包提供信号分类。

它还与deerflow.config的MemoryConfig协作。

MemoryConfig.manager_class决定激活哪个后端。

## 四、重要性评级

评级是8分。

理由如下。

它是记忆系统的唯一正式入口。

它的后端无关契约是换后端机制的基石。

门面不导入后端，保证了未用后端的导入成本为零。

docstring里不重导出的名单划清了共享与私有的边界。

这种边界声明防止了后端细节泄漏。

扣分点在于它的成员不多但契约极重。

MemoryManager是全系统的关键接口。
