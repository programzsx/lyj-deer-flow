# deerflow.subagents包档案

## 一、这个模块是干什么的

deerflow.subagents包是子代理机制的包门面。

源文件是backend/packages/harness/deerflow/subagents/__init__.py。

它的核心设计是混合门面。

一部分成员立即导入。

一部分成员懒加载。

立即导入的是config和registry的五个轻量成员。

懒加载的是重成员。

懒加载用模块级__getattr__实现。

__getattr__的懒加载结果会缓存进globals。

第二次访问不再触发__getattr__。

## 二、模块里的主要成员

它在导入时提供三个成员。

成员是SubagentConfig、get_available_subagent_names、get_subagent_config、list_subagents。

这些来自config和registry模块。

它用__getattr__懒加载三个名字。

名字是SubagentExecutor、SubagentResult、SubagentRuntime。

SubagentExecutor和SubagentResult来自executor模块。

两者一起导入一起缓存。

SubagentRuntime来自runtime模块。

单独导入单独缓存。

懒加载的动机是executor和runtime是重模块。

导入成本高。

全部七个名字在__all__里。

注意__all__里登记了SubagentExecutor和SubagentResult。

但两者不在导入时提供。

这与app.gateway的模式一致。

__all__声明完整门面。

__getattr__负责延迟兑现重成员。

## 三、它和谁协作

它向内依赖config、registry、executor、runtime四个模块。

它向外被代理和工具消费。

subagent_limit_middleware和task_tool用它获取子代理。

它下面挂着builtins子包。

builtins子包提供内置子代理配置。

它还与batch_service协作。

batch_service提供批次执行。

app.subagent_batches包把它转发到应用层。

## 四、重要性评级

评级是7分。

理由如下。

它是子代理机制的正式契约入口。

config加registry加executor加runtime四个面在这里收敛。

懒加载把重模块挡在包根导入之外。

__getattr__缓存进globals的写法是本仓库懒加载的标准实现。

扣分点在于__all__与实际导入状态不一致。

新人容易误以为__all__里的成员都能立即导入。
