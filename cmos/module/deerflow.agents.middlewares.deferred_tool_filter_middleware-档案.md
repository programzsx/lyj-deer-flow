# deerflow.agents.middlewares.deferred_tool_filter_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/deferred_tool_filter_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责隐藏延迟加载的工具。

DeerFlow支持MCP工具搜索功能。

开启tool_search之后，MCP工具的schema不会直接发给模型。

模型必须先用tool_search发现工具。

发现之后工具才被"提升"。

提升之后模型的请求里才会带上这个工具的schema。

这个中间件做两件事。

第一件事是过滤。

模型调用前，这个中间件把还没提升的工具从request.tools里删掉。

模型看不到未提升的工具，就不会凭空调用。

第二件事是拦截。

模型调用了未提升的工具时，这个中间件直接返回错误ToolMessage。

错误消息提示模型先调用tool_search。

这样运行不会中断。

## 二、模块里的主要成员

### 1、DeferredToolFilterMiddleware类

这是模块里唯一的类。

这个类继承AgentMiddleware。

### （1）__init__构造函数

构造函数接收两个参数。

第一个参数是deferred_names。

deferred_names是延迟工具名的冻结集合。

第二个参数是catalog_hash。

catalog_hash是工具目录的哈希。

这两个参数在构造时注入。

不依赖ContextVar。

### （2）release_policy_parameters方法

这个方法返回中间件的行为配置。

返回内容有延迟工具名列表、目录哈希、提升作用域。

这是中间件的自描述机制。

### （3）_promoted方法

这个方法从图状态里读提升记录。

提升记录存在state的promoted键下。

提升记录带着目录哈希。

只有哈希匹配时提升记录才有效。

哈希不匹配时返回空集合。

这样过期的持久化提升记录不会暴露已改名或已漂移的工具。

### （4）_hidden方法

这个方法计算当前应该隐藏的工具。

计算方式是延迟集合减去已提升集合。

结果就是未提升的工具。

### （5）_filter_tools方法

这个方法从请求里删掉未提升工具的schema。

没有延迟工具时直接返回原请求。

没有隐藏工具时也直接返回原请求。

有隐藏工具时用request.override生成新请求。

新请求的tools只保留可见工具。

同时记录一条debug日志。

### （6）_blocked_tool_message方法

这个方法为未提升的工具调用构造错误ToolMessage。

工具名不在隐藏集合时不拦截。

被拦截时返回的ToolMessage带status=error。

内容提示模型先调用tool_search。

### （7）四个钩子方法

wrap_model_call和awrap_model_call是模型调用钩子。

这两个方法先过滤tools，再交给内层处理。

wrap_tool_call和awrap_tool_call是工具调用钩子。

这两个方法先检查是否要拦截，不拦截才交给内层执行。

同步和异步逻辑互为镜像。

## 三、它和谁协作

这个中间件和McpRoutingMiddleware协作。

McpRoutingMiddleware根据最新用户消息自动提升匹配的工具。

提升动作写进图状态的promoted键。

这个中间件读promoted键。

这个中间件还被DeferredToolPromotionAuditMiddleware观察。

审计中间件观察tool_search的最终Command。

装配位置在tool_error_handling_middleware.py的_build_runtime_middlewares里。

这个中间件是可选的。

配置开关是tool_search.enabled。

关闭tool_search时这个中间件不装配。

依赖deerflow.thread_state的promoted状态定义。

## 重要性评级

评级是6分。

理由如下。

tool_search是MCP工具接入的关键机制。

没有这个中间件，大量MCP工具的schema会一次性塞进模型上下文。

上下文会膨胀，模型也会凭空调用没见过的工具。

这个中间件保证"先发现，后使用"的顺序。

所以这个中间件有价值。

不评更高分的原因是这个中间件是可选组件。

不开tool_search时这个中间件完全缺席。

逻辑本身也比较简单，过滤加拦截两条路径。

所以评级是6分。
