# deerflow.agents.middlewares.knowledge_scope_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/knowledge_scope_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责知识范围的执行。

DeerFlow支持按消息限定知识范围。

用户消息可以携带knowledge_scope标记。

标记声明本轮允许访问哪些知识。

这个中间件做三件事。

第一件事是解析范围。

before_agent钩子从运行时上下文或用户消息里解析出执行范围。

第二件事是擦除。

模型调用前，这个中间件把模型消息里的范围和展示数据擦掉。

第三件事是禁用执行。

范围声明为disabled时，这个中间件把knowledge_search工具从请求里删掉。

模型调用了knowledge_search时直接返回错误ToolMessage。

禁用判断不读存储。

也不读RAGFlow。

只看运行时上下文里的范围声明。

## 二、模块里的主要成员

### 1、常量

_KNOWLEDGE_SEARCH_TOOL_NAME是知识搜索工具名，值是knowledge_search。

KNOWLEDGE_SCOPE_KEY是消息additional_kwargs里的范围标记键。

KNOWLEDGE_SCOPE_RUNTIME_KEY是运行时上下文里的范围键。

这两个常量来自deerflow.knowledge_scope模块。

### 2、辅助函数

_runtime_context函数从运行时对象里取context字典。

context不是字典时返回None。

_scope_from_runtime函数从运行时上下文里取执行范围。

先做规范化，再转成执行范围。

### 3、KnowledgeScopeMiddleware类

这是模块里唯一的类。

这个类继承AgentMiddleware。

### （1）before_agent钩子

这个钩子在每个run开始时解析知识范围。

解析优先级是运行时上下文优先。

上下文里已有范围时直接规范化并写回。

写回的值是Gateway承认的执行范围。

上下文里没有范围时从消息里找。

候选消息的确定分两种情况。

有检查点边界时，取不在边界消息ID集合里的消息。

没有边界时，只取最后一条消息。

独立调用者不一定暴露检查点边界。

绝不向后搜索任意历史来找范围。

候选消息里additional_kwargs带范围标记的收集起来。

范围标记只允许出现在HumanMessage上。

非HumanMessage带标记直接抛ValueError。

超过一条消息带标记也抛ValueError。

只有一条时规范化并写进运行时上下文。

### （2）_prepare_model_request方法

这个静态方法准备模型请求。

第一件事是擦除消息里的范围和展示数据。

strip_message_knowledge_scope处理每条消息。

第二件事是禁用工具。

范围声明为disabled时把knowledge_search从tools里删掉。

消息和工具都没变化时返回原请求。

有变化时用request.override生成新请求。

### （3）_disabled_tool_message方法

这个静态方法构造禁用错误消息。

调用的工具不是knowledge_search时不拦截。

运行时上下文里没有范围或范围不是disabled时不拦截。

被拦截时返回错误ToolMessage。

内容是"Error: Knowledge search is disabled for this turn."。

### （4）四个钩子方法

wrap_model_call和awrap_model_call是模型调用钩子。

这两个方法先准备请求，再交给内层处理。

wrap_tool_call和awrap_tool_call是工具调用钩子。

这两个方法先检查是否要拦截，不拦截才交给内层执行。

同步和异步逻辑互为镜像。

## 三、它和谁协作

这个中间件紧跟InputSanitizationMiddleware。

输入净化在最外层。

这个中间件在净化之后执行。

它只暴露Gateway承认的执行范围。

范围从Gateway运行时上下文进入。

范围声明的写入方是Gateway。

Gateway在用户消息上打knowledge_scope标记。

禁用判断不读知识存储。

也不读RAGFlow。

这样范围执行不依赖外部服务。

CURRENT_RUN_PRE_EXISTING_MESSAGE_IDS_KEY来自runtime.context_keys模块。

这个键提供本run之前的消息ID边界。

依赖deerflow.knowledge_scope模块的范围规范化和执行范围转换。

装配在tool_error_handling_middleware.py的_build_runtime_middlewares里。

## 重要性评级

评级是6分。

理由如下。

知识范围是按消息限定知识访问的机制。

这个机制让一次会话里不同轮次可以有不同的知识可见性。

没有这个中间件，声明的范围只是消息上的数据。

标记不会被强制执行。

擦除范围数据也防止范围信息污染模型上下文。

禁用执行不读外部服务，判断路径简单可靠。

所以这个中间件有价值。

不评更高分的原因是knowledge_search是可选功能。

大多数会话不携带范围声明。

中间件在无范围时基本是透传。

逻辑本身也比较小。

所以评级是6分。
