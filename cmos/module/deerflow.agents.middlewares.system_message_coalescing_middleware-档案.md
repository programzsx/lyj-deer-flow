# deerflow.agents.middlewares.system_message_coalescing_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/system_message_coalescing_middleware.py。

## 一、这个中间件是干什么的

这个中间件把多个SystemMessage合并成一个位于开头的SystemMessage。

DeerFlow的主智能体运行时会积累多个SystemMessage。

原因有两个。

第一个原因是DynamicContextMiddleware用ID交换技术替换第一条或最后一条HumanMessage。

替换后的三元组的第一个元素是SystemMessage提醒。

日期和元数据是框架拥有的。

这些内容不能伪装成用户输入。

这是OWASP LLM01的要求。

第二个原因是跨午夜时第二个SystemMessage被注入，用来更新日期。

问题在模型这一侧。

严格的OpenAI兼容后端会拒绝不在开头的SystemMessage。

这些后端包括vLLM、SGLang、Qwen。

Anthropic也拒绝。

报错是"System message must be at the beginning"或"Received multiple non-consecutive system messages"。

官方OpenAI API容忍会话中段的SystemMessage。

所以这个问题只在严格后端上暴露。

这个中间件把所有SystemMessage合并成一个开头的SystemMessage。

这是一个与具体提供商无关的修复。

所有严格后端都受益。

不用每个提供商打一个补丁。

这个中间件只改每次请求的载荷。

检查点里的持久化对话状态不改。

按标记扫描历史的中间件不受影响。

## 二、模块里的主要成员

### 1、_flatten_content

这个函数把消息内容转成普通字符串。

内容可能是字符串。

内容也可能是列表，用于多模态。

DeerFlow的SystemMessage总是普通字符串。

这个函数处理任何内容形状，保证健壮性。

列表里的字符串直接收集。

列表里的字典取text字段。

其他转成字符串。

用换行连接。

### 2、_coalesce_request

这个函数是合并逻辑的核心。

这个函数的流程如下。

第一步找出messages里的所有SystemMessage。

一个都没有就返回None。

返回None意味着请求零改动。

这一步保护前缀缓存命中。

前缀不变，提供商的缓存继续有效。

第二步收集要合并的部分。

request.system_message排在最前。

LangChain 1.2.15之后静态系统提示在单独的system_message字段里。

模型调用处理器在最后一刻把它平铺进消息列表。

只扫描messages的中间件看不到静态系统提示。

会变成空操作。

这个函数同时检查两个来源。

第三步去重dynamic_context提醒。

只保留最后一条提醒。

跨午夜时合并内容会有两个相邻矛盾的current_date块。

中间隔开的对话轮次在合并后消失了。

没有时间锚点，模型要猜该忽略哪个日期。

模型应该只看到最新日期。

第四步保留第一个SystemMessage的id。

通常这是静态系统提示的id。

下游按首个系统消息id做键的消费不受影响。

合并所有部分的additional_kwargs。

提醒上的hide_from_ui、dynamic_context_reminder等标记保留在合并块上。

再盖上provenance标记。

用provenance_kwargs(ContentKind.MIDDLEWARE_INJECTION, "system_coalescing")。

content_kind、producer_kind由系统统一盖章。

即使没有观察者也盖章。

下游无法恢复生产者。

第五步构建合并后的SystemMessage。

内容用空行连接各部分。

第六步返回覆写后的请求。

system_message字段放合并块。

messages字段只留非System消息。

### 3、SystemMessageCoalescingMiddleware类

这个类继承AgentMiddleware。

这个类没有构造参数。

release_policy_parameters返回合并策略的自我描述。

strategy是merge_leading_system_message。

dynamic_context_reminder_dedup是keep_last。

这两个值就是中间件的全部行为。

### 4、_maybe_coalesce

这个静态方法调用_coalesce_request。

返回None就原样返回请求。

### 5、wrap_model_call和awrap_model_call

两个钩子都调用_maybe_coalesce。

然后把结果交给handler。

用wrap_model_call而不用before_agent是有原因的。

wrap_model_call在最终请求载荷上运行。

此时system_message和messages还是分开的字段。

合并能看到两处。

持久化的state里messages从不被改。

检查点结构对每个历史扫描者保持完整。

历史扫描者包括内存构建器、运行日志、压缩、动态上下文检测。

## 三、它和谁协作

在中间件链里这个中间件属于lead专属段。

装配顺序在共享运行时基础段之后。

上游是DynamicContextMiddleware。

DynamicContext注入的提醒SystemMessage是本中间件的主要合并对象。

跨午夜时DurableContext注入的第二条SystemMessage也被合并。

下游是模型调用处理器。

处理器把system_message平铺到消息列表最前面。

本中间件依赖dynamic_context_middleware的is_dynamic_context_reminder做提醒识别。

依赖deerflow_extension_api的ContentKind和provenance_kwargs做来源盖章。

子智能体构建器把自己的日期上下文中间件放在本合并器之前。

内置子智能体提示和隐藏的日期提醒作为一个系统块到达提供商。

claude_provider里有针对Claude的逐请求合并。

本中间件把同样的修复提到了与提供商无关的层。

## 重要性评级

评级是6分。

理由如下。

严格后端在没有这个中间件时直接报错。

vLLM、SGLang、Qwen、Anthropic都是支持的部署目标。

没有这个中间件，这些后端上多SystemMessage的运行会失败。

这是一个与提供商无关的单点修复。

不用每个提供商打补丁。

零改动路径保护前缀缓存。

提醒去重处理了跨午夜的矛盾日期。

检查点状态不被触碰，历史扫描者不受影响。

所以评级是6分。

不评更高分的原因有两个。

第一，这个中间件只解决一个格式兼容问题。

问题域很窄。

第二，官方OpenAI API不受此问题影响。

使用官方API的部署即使删掉它也不受影响。
