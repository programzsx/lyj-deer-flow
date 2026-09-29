# deerflow.agents.middlewares.input_sanitization_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/input_sanitization_middleware.py。

## 一、这个中间件是干什么的

这个中间件是输入防护栏。

它防御提示词注入攻击。

用户消息里可能出现XML风格的标签。

比如<system>、<system-reminder>这类标签。

这些标签本来是框架注入可信上下文用的。

攻击者把这类标签放进用户消息，就能伪造框架上下文。

这个中间件的处理策略是转义而不是拒绝。

被拦截的标签做HTML转义。

<system>变成&lt;system&gt;。

转义后标签渲染成字面文本。

标签失去结构意义。

用户的真实意图保留下来。

用户问"怎么用system标签"这类问题仍然能正常工作。

干净输入还会包上纯文本边界标记。

边界标记是BEGIN USER INPUT和END USER INPUT。

这是第二层语义防护。

## 二、模块里的主要成员

### 1、_BLOCKED_TAG_NAMES集合

这是被拦截标签名的有限集合。

集合包括三类标签。

第一类是框架注入的结构块。

包括system-reminder、memory、current_date、durable_context_data、project、documents等。

第二类是子智能体的系统提示块。

包括file_editing_workflow、guidelines、output_format、working_directory、report_contract等。

第三类是常见的注入标签模式。

包括system、instruction、override、ignore、prompt等。

框架新增权威块标签时必须同步更新这个集合。

测试钉住集合的准确数量。

新框架标签不能绕过回归保护。

### 2、_BLOCKED_TAG_PATTERN正则

这个正则匹配完整的被拦截标签。

匹配<tag>、</tag>、<tag attrs>、<tag/>等形式。

匹配时不区分大小写。

### 3、边界标记相关函数

_USER_INPUT_BEGIN是开始标记。

_USER_INPUT_END是结束标记。

_NEUTRALIZED_BEGIN和_NEUTRALIZED_END是形似的中性替代形式。

替代形式视觉相似但不匹配真实边界分隔符。

_neutralize_boundary_tokens函数把用户文本里的真实标记换成中性形式。

### 4、_escape_tag_match函数

这个函数对匹配到的标签做转义。

把<和>换成HTML实体。

### 5、neutralize_untrusted_tags函数

这是共享的中和原语。

任何来自信任边界外、即将作为数据进入模型上下文的内容都用它。

它做两件事。

第一件是转义被拦截的框架或注入标签。

第二件是中和边界标记。

它故意不包边界标记。

包标记是用户消息特有的处理。

### 6、frame_untrusted_text函数

这个函数先净化再包边界标记。

空文本原样返回。

被拦截标签先转义。

已完整包标记的文本保持幂等。

幂等检查是严格的前后缀匹配。

只输入begin标记不等于已包装。

包装前还会中和内嵌的边界标记。

这防止break-out攻击。

攻击者伪造外层包装，再注入内层标记。

### 7、_extract_text_from_content方法

这个静态方法从内容里提取文本。

内容可以是纯字符串。

也可以是内容块列表。

列表里可以有裸字符串和文本块字典。

裸字符串也收集。

跳过裸字符串会漏掉整条消息的净化。

### 8、_rebuild_content方法

这个静态方法重建内容列表。

文本块合并成单个文本块。

文本块之间的非文本块保留原位。

比如text、image、text结构，image块保留在中间。

### 9、InputSanitizationMiddleware类

这是中间件类。

这个类继承AgentMiddleware。

### （1）_sanitize_message方法

这个方法净化单条用户消息。

返回净化后的副本。

不需要变化时返回None。

原消息不被修改。

处理逻辑分几种情况。

additional_kwargs里有original_user_content时只净化用户的原始输入。

服务器注入的可信块不会被扫描。

original_user_content是空字符串时不净化，服务器块原样保留。

没有original_user_content时扫描全部文本内容。

rfind失败时降级处理。

多模态列表内容逐块净化用户块。

无法区分块时降级到全内容净化。

全内容净化可能转义服务器块，但用户伪造仍被中和。

净化后的消息保留original_user_content。

下游消费者可以恢复真实输入。

### （2）_process_request方法

这个方法净化请求里的每条真实用户消息。

范围是整个对话，不只是最新一轮。

原因是转换是请求作用域的。

线程状态保留原始文本。

只扫最后一轮，净化的负载只在一个调用里生效。

下一轮会原样重放给模型。

每条消息单独恢复错误。

一条历史消息处理失败不会扩大成"本轮不净化"。

失败的失败方向是fail-open。

### （3）_try_process方法

这个方法包一层异常保护。

意外错误时返回原请求。

GraphBubbleUp控制流信号向上传播。

### （4）wrap_model_call和awrap_model_call钩子

这两个钩子调用_try_process。

同步和异步逻辑互为镜像。

## 三、它和谁协作

这个中间件是运行时中间件链的第一个成员。

装配在tool_error_handling_middleware.py的_build_runtime_middlewares里。

它是最外层的wrap_model_call包装。

内层所有中间件看到的都是净化后的消息。

包括LLM重试中间件。

requires_input_sanitization来自message_utils模块。

这个函数定义净化范围。

框架注入的消息被排除。

转义它们的块会破坏可信上下文。

调用方提供的消息被覆盖，即使消息带框架标记。

Gateway在入口处标记这些消息。

original_user_content由UploadsMiddleware和IM渠道设置。

子智能体通过build_subagent_runtime_middlewares复用这个净化。

ToolResultSanitizationMiddleware是这个中间件的镜像。

后者处理远程工具结果这个不可信入口。

两者共享neutralize_untrusted_tags原语。

## 重要性评级

评级是9分。

理由如下。

提示词注入是LLM系统的头号安全威胁。

用户消息是不可信内容的主要入口。

没有这个中间件，攻击者可以伪造框架上下文。

伪造的记忆块、技能块、项目块都能骗过模型。

这个中间件覆盖整个对话历史。

转换是请求作用域的。

降级路径也保证用户伪造被中和。

测试钉住拦截标签集合。

所以评级是9分。

不评10分的原因是fail-open策略留下了理论缺口。

一条处理失败的消息原样通过。

另外远程工具结果由ToolResultSanitizationMiddleware单独处理。

本中间件只守一个入口。

所以评级是9分。
