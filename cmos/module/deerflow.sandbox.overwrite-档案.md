# deerflow.sandbox.overwrite档案

## 一、这个模块是干什么的

这个模块处理LangGraph的Overwrite包装的通道值。

Fork恢复的checkpoint可能把沙箱通道值以`langgraph.types.Overwrite`包装的形式交付。回滚恢复通过状态变更图以replace风格的写入应用。直接在包装器上读`sandbox["sandbox_id"]`或`sandbox.get("sandbox_id")`会崩溃。所以先解包再使用。

这个模块只有一个函数。`unwrap_sandbox`。

## 二、模块里的主要成员

### 1、unwrap_sandbox函数

解包一个Overwrite包装的沙箱通道值。

返回一个二元组。第一个元素是值本身。第二个元素是fork_restored标志。

- 值是Overwrite包装时。返回包装的值，fork_restored为True。
- 值不是包装时。原样返回，fork_restored为False。

### 2、fork_restored标志的语义

包装形式重放父线程的沙箱状态。调用方必须不把这个沙箱当作本次运行拥有的。比如不释放它。

这个标志被多个调用点使用。

- 中间件的after_agent。fork恢复的沙箱不释放。释放它会驱逐父的温沙箱。
- ensure_sandbox_initialized。fork恢复的执行保持包装。绑定一个不释放的持有者。
- is_local_sandbox。只读分类。包装可以安全丢弃。

## 三、它和谁协作

这个模块只依赖`langgraph.types.Overwrite`。

这个模块被`deerflow.sandbox.middleware`调用。after_agent和before_agent读沙箱状态时先解包。

这个模块被`deerflow.sandbox.tools`调用。sandbox_from_runtime、is_local_sandbox、ensure_sandbox_initialized读沙箱状态时先解包。

## 四、重要性评级

评级是4分。

理由。这个模块解决一个非常具体的崩溃场景。fork恢复的checkpoint交付Overwrite包装的沙箱通道值。直接读会崩溃。解包防止崩溃。

fork_restored标志的语义很关键。包装形式重放父线程的沙箱状态。释放它会把父的温沙箱驱逐。这个标志保护了fork场景的沙箱所有权。

但它的代码量极小。一个函数。二十行。它是一个纯工具函数。作用面也很窄。只有fork恢复的场景才真正走到它的包装分支。所以重要性偏低。
