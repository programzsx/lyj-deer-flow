# deerflow.agents.middlewares.tool_progress_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_progress_middleware.py。

## 一、这个中间件是干什么的

这个中间件是工具停滞守卫。

它实现RFC #3177。

智能体有时会反复调用同一个工具。

工具反复返回同样的失败或同样的内容。

模型在死路上打转。

浪费token和API调用。

这个中间件用一个状态机检测停滞。

状态机按线程加工具名维度跟踪。

工具连续出问题时进入WARNED状态。

WARNED时注入提示。

提示告诉模型换策略。

工具继续出问题时升级到BLOCKED。

BLOCKED时这个工具被硬阻断。

阻断的消息是错误ToolMessage。

模型必须换其他工具或总结收尾。

一句话总结。

这个中间件不让模型在一个坏工具上反复撞墙。

## 二、模块里的主要成员

### 1、状态数据结构

ToolPhaseState是按线程加工具的跟踪状态。

它有四个字段。

字段一是phase。

phase的值是active、warned、blocked。

字段二是consecutive_problems。

字段三是block_reason。

字段四是recent_word_sets。

recent_word_sets是不可变元组。

不可变元组防止可变列表在新旧状态对象间共享。

共享会导致跨状态污染。

ToolPhaseTransition描述产生持久阶段变化的确切规则。

它有action和threshold两个字段。

action的值是warn、block、recover、reset。

threshold在类别规则、恢复、reset时是None。

### 2、内容相似度辅助函数

word_set提取小写单词。

单词长度至少3。

内容截断到8192字符。

截断限制大结果上的正则开销。

截断尾部的词不进集合。

这是可接受的。

因为重复检测是启发式不是保证。

is_near_duplicate用Jaccard相似度判断。

当前词集和最近3个词集比较。

交集除以并集超过阈值就是近似重复。

### 3、元数据校验辅助函数

_audit_status把生产者状态投影到规范词汇表。

不在词汇表里就归为unknown。

_audit_error_type投影到有界的审计词汇表。

_audit_next_action只保留框架定义的恢复动作。

_audit_recoverable拒绝非布尔的truthy值。

这些函数防止不可信的工具戳污染审计事件。

### 4、提示和阻断理由格式化

_format_hint生成提示文本。

提示按error_type或status生成基础文案。

提示按recommended_next_action生成建议后缀。

no_results的提示是搜索无结果。

not_found的提示是资源反复未找到。

rate_limited的提示是被限流。

success加近似重复的提示是返回重复结果。

_block_reason生成阻断理由。

auth的理由是认证失败工具不可用。

config的理由是工具未配置。

### 5、类ToolProgressMiddleware

这个类是中间件主体。

#### （1）构造函数和配置

构造参数包括stagnation_threshold。

默认是3。

包括warn_escalation_count。

默认是2。

包括inject_assessment。

包括jaccard_threshold。

默认是0.8。

包括min_words。

默认是10。

包括exempt_tools。

豁免工具默认是ask_clarification、write_todos、present_files、task。

包括max_tracked_threads。

默认是100。

from_config从ToolProgressConfig构造。

#### （2）状态存储

状态存储是LRU淘汰的字典。

键是thread_id。

值是工具名到ToolPhaseState的映射。

线程数超过上限时淘汰最老的线程。

淘汰时同步清掉对应线程的待注入提示。

防止提示队列无限增长。

锁用threading.Lock。

不用asyncio.Lock。

因为内嵌调用方会从多个线程用同步包装。

记录器回调故意在状态锁释放后调用。

可观测性不能拖慢工具状态更新。

#### （3）wrap_tool_call钩子

wrap_tool_call包裹同步工具执行。

工具名在豁免名单里就直接放行。

runtime不存在就直接放行。

工具已被阻断时拦截调用。

拦截返回_make_blocked_message生成的错误消息。

被阻断的调用不会执行handler。

工具未阻断时执行handler。

然后调用_update_state_from_result更新状态机。

#### （4）awrap_tool_call钩子

awrap_tool_call是异步版本。

逻辑和同步版本完全一样。

#### （5）_assess_and_transition状态机

这是状态机的核心。

先处理blocked守卫。

blocked是终态。

这个函数不应该改变blocked。

正常流程里blocked在wrap_tool_call就被拦截了。

这个检查让并发竞争的语义是确定的。

防止一个可恢复错误把阶段悄悄降回warned。

然后计数问题。

consecutive_problems加1。

所有退出路径保持计数一致。

工具失败时计数不会是0。

然后处理立即阻断。

不可恢复且动作是stop的错误立即阻断。

这类错误包括auth、config、internal。

没有重试能帮上忙。

然后判断是否算问题。

error和partial_success算问题。

success且词集近似重复也算问题。

success且不重复就是好结果。

好结果重置计数。

阶段回到active。

warned恢复到active时记录recover转换。

然后处理升级。

计数超过阈值加升级数时。

可恢复错误保持warned并重新注入提示。

阻断会阻止合法的换参数重试。

不可恢复错误阻断工具。

模型没法靠重试修复。

硬阻断节省API调用。

计数达到停滞阈值时进入warned。

注入提示。

#### （6）提示注入

wrap_model_call在模型看到消息前排空待注入提示。

提示去重后追加成HumanMessage。

消息的name是progress_hint。

模型调用抛异常时提示被放回队列。

LLMErrorHandlingMiddleware在这个中间件外面。

它会重试失败的调用。

重试必须还能找到提示。

_restore_pending把提示插回队列头部。

队列上限是_MAX_PENDING_PER_RUN。

值是3。

#### （7）生命周期钩子

before_agent和abefore_agent清理过期状态。

清理分两步。

第一步清掉同线程旧运行的待注入提示。

第二步重置本线程所有工具的状态。

重置是无条件的。

被阻断的工具回到active。

工具重新阻断说明根因还在。

模型没有上一个运行的提示记忆。

active但有残余计数的工具也清零。

新运行里模型看不到旧运行的上下文。

旧计数会造成误报。

每次before_agent重置是有意的策略。

限流和瞬时错误是时间相关的。

带着过期计数进入后面的图入口会在本可成功的调用上误报阻断。

#### （8）审计事件

有效阶段变化发middleware:tool_progress事件。

包括reset。

后面一次智能体调用清掉WARNED或BLOCKED状态时发reset。

记录用_record_phase_transition。

记录通过resolve_audit_recorder解析记录器。

子智能体归属来自服务端安装的记录器。

事件字段包括is_subagent、agent_id、tool_name、from_phase、to_phase、consecutive_problems。

还包括status、error_type、recoverable_by_model、recommended_next_action、threshold。

参数、内容、提示、哈希不会被持久化。

记录失败是fail-open的。

可观测性不能改变进度守卫或智能体运行。

#### （9）LRU读路径细节

_get_block_reason是只读检查。

它不调用move_to_end。

在读路径上更新新近度会让被阻断的线程永久占据LRU槽位。

健康线程就进不来了。

新近度只在_get_state的写路径上更新。

## 三、它和谁协作

这个中间件位于工具调用包装链的外层。

它在ToolErrorHandlingMiddleware的外面。

它读到的结果已经带deerflow_tool_meta。

没有元数据的非豁免工具会记录warning。

warning提示验证装配顺序。

它和LoopDetectionMiddleware分工。

分工关系如下。

ToolProgress是结果质量守卫。

它在工具执行后触发。

它检查返回内容。

它阻断产出不了新信息的特定工具。

LoopDetection是调用模式守卫。

它在模型响应后触发。

它检查AIMessage里的tool_calls签名。

它在模型反复发同样的调用时停掉整轮。

两者互补不竞争。

ToolProgress是细粒度的。

它阻断单个工具。

其他工具正常。

LoopDetection是粗粒度的。

它清掉所有tool_calls。

它结束整轮。

两者可以在同一次模型调用里都注入HumanMessage提示。

模型能看到两组提示。

LoopDetection硬停时不会有wrap_tool_call。

ToolProgress不会触发。

没有双重停止。

它依赖tool_result_meta的元数据词汇表。

依赖audit_context解析记录器。

依赖runtime.events.catalog的事件标签。

它被tool_error_handling_middleware.py按tool_progress.enabled装配。

配置来自AppConfig的tool_progress键。

## 重要性评级

评级是7分。

理由如下。

停滞是智能体运行最烧钱的失败模式。

模型在一个坏工具上反复撞墙。

每次撞墙都消耗token和API调用。

这个中间件早期注入提示。

提示让模型在浪费扩大前换策略。

它的状态机设计很精细。

可恢复和不可恢复错误走不同路径。

可恢复错误保持warned。

不可恢复错误阻断。

Jaccard重复检测抓住"成功但重复"的隐性问题。

审计事件完整且防伪。

LRU和并发语义都有仔细处理。

它和LoopDetection分工明确。

所以评级是7分。

不评更高分的理由是它是可选守卫。

tool_progress.enabled默认没开时它不装配。

关闭它运行仍能完成。

只是可能浪费更多。
