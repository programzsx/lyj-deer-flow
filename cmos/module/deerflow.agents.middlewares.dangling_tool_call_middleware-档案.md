# deerflow.agents.middlewares.dangling_tool_call_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/dangling_tool_call_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责修复消息历史里的工具调用残缺。

残缺有两种。

第一种叫悬空工具调用。

AIMessage里有tool_calls。

但是历史里没有对应的ToolMessage。

原因通常是用户中断或请求取消。

模型发起调用后运行被打断。

结果永远不会回来。

第二种叫孤儿工具结果。

ToolMessage存在。

但是没有匹配的AIMessage tool_call。

原因通常是摘要压缩或分支裁剪掉了上游AIMessage。

调用没了，结果还在。

这两种残缺都会让严格的provider拒绝请求。

比如严格OpenAI兼容的后端会返回HTTP 400。

这个中间件在模型调用前拦截请求。

它做三件事。

它净化畸形的工具调用名和参数。

它为每个悬空调用注入一个带错误指示的占位ToolMessage。

它丢弃调用已不存在的孤儿ToolMessage。

一句话总结。

历史里的调用和结果必须配对。

这个中间件是配对修复师。

缺结果的补占位。

缺调用的删结果。

## 二、模块里的主要成员

### 1、DanglingToolCallMiddleware类

DanglingToolCallMiddleware继承自AgentMiddleware。

核心钩子是wrap_model_call和awrap_model_call。

两个钩子逻辑相同。

钩子调用_build_patched_messages修补消息。

修补结果不是None时用request.override替换消息。

修补只影响单次模型调用。

持久化的检查点状态不被触碰。

### 2、为什么用wrap_model_call不用before_model

模块的docstring解释了这个选择。

before_model加add_messages只能把占位消息追加到列表末尾。

但是占位消息必须插在悬空AIMessage的紧后面。

位置不对，provider还是拒绝。

wrap_model_call可以在正确位置插入。

### 3、_message_tool_calls方法

这个方法返回一条消息的规范化工具调用列表。

调用可能来自三个来源。

第一个来源是结构化的tool_calls字段。

第二个来源是additional_kwargs里的原始provider载荷。

第三个来源是invalid_tool_calls。

LangChain把畸形的provider函数调用存在invalid_tool_calls里。

这些调用不执行。

但是provider适配器可能把调用id和名字序列化回下一个请求。

严格的provider会期待一个匹配的ToolMessage。

所以把它们当作悬空调用处理。

有一个重要的防重复设计。

原始载荷是同一批调用的回退序列化。

OpenAI序列化器只在两个结构化视图都为空时才用原始载荷。

收集原始载荷时必须检查两个结构化视图都为空。

否则同一个调用会被数两次。

一个id会发出两个ToolMessage。

这正是严格provider拒绝的重复id形状。

### 4、_sanitize_ai_message_tool_calls方法

这个方法返回AIMessage的净化副本。

它净化三个字段。

结构化tool_calls里的畸形名字换成unknown_tool。

invalid_tool_calls里的畸形名字和参数被规范化。

additional_kwargs里原始载荷的畸形名字和参数被规范化。

参数规范化用_normalize_tool_arguments。

参数会变成JSON对象字符串。

这样回放对OpenAI兼容provider是安全的。

没有变化时返回原消息。

有变化时用model_copy返回副本。

### 5、_normalize_tool_call_ids方法

这个方法把畸形的工具调用id换成稳定的合成id。

provider省略id时调用解析成空id。

空id永远进不了配对集合。

空id调用的结果会被当孤儿丢弃。

请求到达provider时带着空id和丢失的结果。

所以在最前面把畸形id规范化成合成id。

合成id从调用位置派生。

格式是deerflow_synthetic_tool_call_加消息序号、来源、位置。

配对过程和模型侧消息都用这个id。

不需要在线程间传递状态。

还有逐轮配对设计。

畸形调用按文档顺序遍历。

遇到新的AIMessage就重置open_calls。

结果只回答本轮发出的调用。

早轮的悬空调用不能消费晚轮的结果。

positional标志记录本轮结果和畸形调用是否一比一。

一比一时可以用位置打破平局。

### 6、_claim_synthetic_id方法

这个函数为一条结果认领它回答的畸形调用。

畸形原始id都是空，无法标识自己的结果。

候选先用名字过滤。

名字不矛盾才算候选。

多个候选时用位置打破平局。

位置平局只在positional成立时有效。

两个相同的并行bash调用没有其他区别。

顺序是构造保证。

LangGraph的ToolNode用asyncio.gather或executor.map按输入顺序构建结果。

缺少结果意味着调用被中断。

这时幸存的结果不能信任顺序对应。

无法归属的结果返回None。

孤儿处理会丢弃它。

不发明配对。

### 7、_build_patched_messages方法

这个方法是修补的总入口。

第一步用_normalize_tool_call_ids规范化畸形id。

第二步按tool_call_id把ToolMessage分组。

第三步收集所有AIMessage的有效调用id集合。

第四步重放消息序列。

ToolMessage的id在有效集合里就移动到AIMessage紧后面。

ToolMessage的id不在集合里就是孤儿。

孤儿被静默丢弃。

AIMessage先净化再输出。

AIMessage的每个调用找配对的结果。

找不到就注入占位ToolMessage。

占位消息是error状态。

占位内容来自_synthetic_tool_message_content。

没有任何修补且没有丢弃时返回None。

有丢弃或注入时记录warning日志。

### 8、_synthetic_tool_message_content方法

这个方法生成占位消息的内容。

分三种情况。

第一种是名字缺失或为空。

内容提示模型用可用的工具名重试。

第二种是参数畸形。

畸形write_file调用有专门的内容。

这是issue#2894的workaround。

畸形write_file调用可能带巨大的Markdown载荷。

内容提示模型不要重试同样的大载荷。

内容提示模型直接用普通文本输出报告。

内容提示模型如果还要写文件就分小段。

其他畸形调用带截断到500字符的解析错误。

第三种是调用被中断。

内容是"工具调用被中断且没有返回结果"。

错误详情截断到500字符。

这是_MAX_RECOVERY_ERROR_DETAIL_LEN常量的作用。

保持恢复错误简短。

防止合成ToolMessage把巨大或畸形内容回显给模型。

## 三、它和谁协作

它在共享运行时基座的第8位。

位于SandboxMiddleware之后。

位于LLMErrorHandlingMiddleware之前。

它处理的消息残缺通常由以下情况产生。

用户中断。

请求取消。

摘要压缩裁剪上游消息。

分支裁剪。

它净化后的模型请求让严格的OpenAI兼容provider不返回400。

它和tool_call_metadata的clone_ai_message_with_tool_calls规范互补。

那条规范说删除工具调用必须用clone。

它不进入状态写入。

所有修补只发生在模型调用边界。

它不需要配置。

它在_build_runtime_middlewares里无条件装配。

## 重要性评级

评级是7分。

理由如下。

消息历史残缺是真实运行中常见的情况。

用户随时可能中断一个正在执行工具的运行。

中断必然产生悬空调用。

摘要压缩随时可能裁剪上游AIMessage。

裁剪必然产生孤儿结果。

不修复这些残缺，下一个请求就会被provider以400拒绝。

智能体运行直接卡死。

这个中间件是运行的保底修复层。

它没有配置开关。

每次模型调用都经过它。

它的边界处理非常细致。

畸形id的合成。

逐轮配对。

位置平局。

防重复收集。

大载荷的截断。

不评更高分的原因是它不出现在用户可见的功能面。

用户感知不到它的工作。

它只在出错时发挥作用。

所以评级是7分。
