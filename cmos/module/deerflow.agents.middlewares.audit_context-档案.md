# deerflow.agents.middlewares.audit_context-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/audit_context.py。

## 一、这个中间件是干什么的

这不是一个中间件。

这是一个辅助模块。

这个模块为审计记录器提供运行时上下文解析。

DeerFlow有几个审计记录器。

循环检测有自己的记录器。

工具提升有自己的记录器。

工具进度有自己的记录器。

这些记录器通过运行时上下文传递。

每个记录器有一个专用的上下文键。

键以双下划线开头。

双下划线开头的键会被build_run_config剥离。

这样调用方无法伪造这些键。

这个模块做的事很简单。

它从运行时上下文里解析出记录器。

它同时解析出可信的lead或subagent归属。

一句话总结。

上下文里装着谁在记录。

这个模块负责把记录器安全地取出来。

## 二、模块里的主要成员

### 1、三个上下文键常量

LOOP_DETECTION_RECORDER_CONTEXT_KEY的值是__run_loop_detection_recorder。

TOOL_PROMOTION_RECORDER_CONTEXT_KEY的值是__run_tool_promotion_recorder。

TOOL_PROGRESS_RECORDER_CONTEXT_KEY的值是__run_tool_progress_recorder。

三个键都以双下划线开头。

双下划线前缀是服务端专用键的约定。

build_run_config会剥离调用方提供的双下划线键。

所以这些记录器只能由服务端安装。

### 2、resolve_audit_recorder函数

这个函数是模块的核心。

它接受一个上下文对象和一个recorder_key参数。

它返回一个三元组。

第一个元素是记录器本身。

第二个元素是is_subagent布尔值。

第三个元素是agent_id。

解析逻辑分两步。

第一步检查上下文是不是字典。

不是字典就返回空记录器、False、None。

第二步用recorder_key找记录器。

找到了窄记录器就返回窄记录器、True、agent_id。

agent_id必须是字符串，否则返回None。

没找到窄记录器就回退到__run_journal。

回退时返回__run_journal、False、None。

### 3、信任设计

这个函数的docstring说明了归属权威。

普通lead run拥有__run_journal。

task工具的subagent只收到服务端安装的窄记录器。

所以窄记录器的存在本身就是subagent归属的权威。

调用方提供的is_subagent永远不会被咨询。

这是一个刻意的信任边界。

归属判断不看客户端说了什么。

归属判断只看服务端装了什么。

## 三、它和谁协作

调用方是三个审计中间件。

LoopDetectionMiddleware用LOOP_DETECTION_RECORDER_CONTEXT_KEY。

McpRoutingMiddleware和DeferredToolPromotionAuditMiddleware用TOOL_PROMOTION_RECORDER_CONTEXT_KEY。

ToolProgressMiddleware用TOOL_PROGRESS_RECORDER_CONTEXT_KEY。

__run_journal由lead运行时安装。

subagent执行器安装窄记录器。

这个模块不依赖其他deerflow模块。

它只依赖标准库。

它不进入中间件链。

它只是一个纯函数模块。

## 重要性评级

评级是5分。

理由如下。

这个模块只有29行。

一个函数加三个常量。

但它承载了一个重要的信任边界。

审计事件的subagent归属由它权威判定。

调用方无法通过伪造is_subagent冒充其他执行方。

三个守卫中间件的记录器解析都经过它。

它保证了归属逻辑全系统一致。

不评更高分的原因是它的功能面很窄。

它只做一次字典查找加一个回退。

没有它，各中间件也可以内联这段逻辑。

但共享实现防止了不一致。

所以评级是5分。
