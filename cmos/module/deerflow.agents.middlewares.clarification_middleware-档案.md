# deerflow.agents.middlewares.clarification_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/clarification_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责澄清提问。

智能体在执行任务时可能需要向用户提问。

比如信息缺失、需求有歧义、方案要选择、风险要确认。

DeerFlow为此提供了一个内置工具ask_clarification。

模型调用这个工具时，这个中间件会拦截它。

拦截之后中间件不执行工具。

它把问题格式化成用户友好的消息。

它返回一个Command(goto=END)。

这个Command中断执行，把问题展示给用户。

用户回答之前智能体不会继续。

一句话总结。

模型想问用户问题。

这个中间件把问题变成一张卡片，然后停下来等用户回答。

## 二、模块里的主要成员

### 1、ClarificationMiddleware类

ClarificationMiddleware继承自AgentMiddleware。

state_schema是ClarificationMiddlewareState。

这个state只是兼容ThreadState的空壳。

### 2、after_model钩子

after_model负责丢弃同轮的兄弟工具调用。

提供商会批量发起工具调用。

如果ask_clarification和bash、write_file同轮出现。

兄弟工具会在用户回答之前执行。

LangChain的return_direct检查要求最后一个AIMessage的所有工具调用都是return_direct才路由到END。

混合批次会既执行兄弟工具又回到模型。

所以after_model重写AIMessage。

重写后只保留ask_clarification调用。

兄弟调用从tool_calls里删掉。

兄弟调用的provider内容块也一并删掉。

删除用的是clone_ai_message_with_tool_calls。

裸改tool_calls会让适配器重发陈旧的内容块。

严格的provider会拒绝。

还有一种情况。

ask_clarification的参数畸形时进invalid_tool_calls。

同轮有有效的兄弟调用。

畸形调用也算停止信号。

兄弟调用同样被丢弃。

disable_clarification的运行跳过这个重写。

因为那些运行里澄清会变成一个"继续"的ToolMessage，不是中断。

### 3、wrap_tool_call和awrap_tool_call钩子

wrap_tool_call是同步钩子。

awrap_tool_call是异步钩子。

两者逻辑相同。

钩子先判断调用名。

不是ask_clarification就正常放行执行。

是ask_clarification就检查运行交互策略。

澄清被禁用时调用_handle_disabled_clarification。

澄清可用时调用_handle_clarification。

### 4、_handle_clarification方法

这个方法处理真正的澄清请求。

第一步提取参数question。

第二步调用_normalize_fields规范化表单字段。

第三步调用_format_clarification_message格式化消息。

第四步生成request_id。

request_id来自_stable_message_id。

第五步构建human_input_payload。

第六步创建ToolMessage。

ToolMessage的content是格式化的问题。

ToolMessage的artifact是human_input载荷。

第七步返回Command(goto=END)。

### 5、_handle_disabled_clarification方法

非交互渠道需要禁用澄清。

比如GitHub webhook渠道。

用户只能通过后来的webhook回复。

等回复到达时智能体的这轮早已结束。

澄清会死锁这轮运行。

禁用时返回一个普通ToolMessage。

不是Command(goto=END)。

ToolMessage的内容指导模型无人值守时怎么做事。

低风险且可逆的工作继续做。

高风险或不可逆的工作停下来报告BLOCKED。

禁止猜测或等待人工回复。

### 6、_normalize_fields方法

这个方法规范化表单字段。

它是v2表单模式的核心。

验证是原子的。

任何结构破损的条目让整个表单退化到旧模式。

破损包括以下情况。

条目不是字典。

字段名缺失、空白、超长。

字段名和保留名冲突。

保留名是JavaScript的Object.prototype属性。

比如__proto__、constructor。

前端用普通对象按字段名存值。

这些名字会读到原型成员而不是用户输入。

字段名重复。

字段超过MAX_FORM_FIELDS上限16个。

选项超过MAX_FIELD_OPTIONS上限24个。

文本超过MAX_FIELD_TEXT_CHARS上限200字符。

序列化后超过MAX_FORM_SERIALIZED_BYTES上限16KB。

16KB预算的原因是每项上限允许的表单可能让IM文本回退超出渠道投递限制。

Slack单条消息截断在40k字符。

良性问题只做局部退化。

未知类型退化成text。

无选项的select退化成text。

注意type是[]的情况。

[]是合法JSON。

不可哈希的成员探测会抛TypeError。

所以先做isinstance检查。

### 7、_normalize_options方法

这个方法规范化选项。

有些模型把数组参数序列化成JSON字符串。

比如Qwen3-Max。

字符串先尝试json.loads。

字典走_flatten_dict_option_values递归展平标量叶子。

其他非列表类型包装成单元素列表。

最后剥掉XML标签。

去空白。

去空项。

去重。

去重保持顺序。

空选项必须去掉。

因为前端解析器会拒绝带空标签的整个载荷。

### 8、_build_human_input_payload方法

这个方法构建结构化UI载荷。

协议有版本控制。

legacy模式保持version: 1。

legacy模式包括free_text和choice_with_other。

v2的form模式用version: 2。

老前端会拒绝version: 2并退化到纯文本。

form模式带fields。

choice_with_other模式带options。

回复协议保持v1不变。

表单卡片提交一个文本摘要作为response_kind: text。

所以journal持久化不需要新增白名单条目。

### 9、_format_clarification_message方法

这个方法把参数格式化成可读文本。

不同clarification_type有不同图标。

missing_info用问号。

ambiguous_requirement用思考脸。

approach_choice用分叉箭头。

risk_confirmation用警告。

suggestion用灯泡。

有context时先展示背景再展示问题。

表单字段优先于选项。

字段一行一个。

必填字段标注required。

选项字段列出选项。

multi_select标注可多选。

### 10、_stable_message_id方法

这个方法生成确定性的消息ID。

有tool_call_id时ID是clarification:加tool_call_id。

没有时用格式化消息的sha256前16位。

确定性ID让重试的澄清调用替换而不是追加。

## 三、它和谁协作

它拦截ask_clarification工具。

ask_clarification定义在deerflow.tools.builtins。

它依赖resolve_run_interaction_policy判断运行是否允许澄清。

这个函数来自deerflow.agents.interaction_policy。

非交互上下文把disable_clarification写进运行上下文。

它依赖tool_call_metadata的clone_ai_message_with_tool_calls。

它写ToolMessage.artifact.human_input载荷。

前端读取这个载荷渲染提问卡片。

用户回复是hide_from_ui的HumanMessage。

回复带additional_kwargs.human_input_response。

RunJournal只把白名单里的隐藏来源持久化为llm.human.input。

当前白名单只有ask_clarification。

它在中间件链里必须是最后一个。

因为goto=END之后没有下游。

模型长度终止和安全终止的中间件在它之前。

## 重要性评级

评级是8分。

理由如下。

人机交互是智能体的核心体验。

ask_clarification是模型向用户提问的唯一通道。

这个中间件是提问的完整实现。

没有它，提问功能不存在。

它处理了大量边界情况。

批量工具调用的兄弟丢弃。

畸形参数的降级。

非交互渠道的无人值守指导。

表单的原子验证。

XML选项的展平。

协议版本兼容。

这些边界情况保证卡片永远可渲染。

保证回复永远可解析。

不评10分的原因是它只在模型主动提问时起作用。

多数运行不会触发ask_clarification。

基础对话流不经过它。

所以评级是8分。
