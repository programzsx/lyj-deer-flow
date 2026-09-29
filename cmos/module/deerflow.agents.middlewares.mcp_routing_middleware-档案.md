# deerflow.agents.middlewares.mcp_routing_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/mcp_routing_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责在模型调用前自动提升延迟加载的MCP工具。

MCP工具有一套延迟装配机制。

未提升的工具schema对模型隐藏。

模型要用tool_search工具主动搜索，或者被提升后才能看到schema。

这个中间件做的事是反向的路由提示。

它读用户最新的消息文本。

它拿文本去匹配MCP路由索引里的关键词。

匹配命中的工具直接写入提升状态。

这样模型不用先调tool_search就能看到相关MCP工具。

用户说"帮我查一下百科"，中间件就从路由索引命中wiki工具，提前提升schema。

这个中间件故意只做最小的事。

它只接收序列化的路由数据。

它不持有BaseTool对象。

它不执行任何工具。

它不过滤任何工具调用。

隐藏未提升schema和拦截未提升调用的职责归DeferredToolFilterMiddleware。

## 二、模块里的主要成员

### 1、McpRoutingMiddleware类

这是模块的核心类。

构造参数有三个。

routing_index是路由索引。

catalog_hash是工具目录的哈希值。

top_k是一次最多提升的工具数量。

top_k经过clamp_auto_promote_top_k夹取到安全范围。

### 2、McpRoutingIndexEntry和McpRoutingIndex

McpRoutingIndexEntry是路由索引条目的TypedDict。

包含priority优先级和keywords关键词列表。

McpRoutingIndex是工具名到条目的映射类型。

### 3、_normalize_index静态方法

这个方法对路由索引做防御性再归一化。

这个中间件被设计为接受任意序列化路由数据。

不限于tool_search的_routing_priority和_routing_keywords的输出。

归一化规则包括名称转字符串、空名跳过、优先级解析失败回退为0、关键词过滤空白项。

关键词为空的条目跳过。

### 4、_latest_user_message静态方法

这个方法找最新的真实用户消息。

包括隐藏的HumanInputCard回复。

卡片回复对UI隐藏，但仍然是用户当前的请求。

所以判断用的是is_genuine_user_message，不是is_real_user_message。

后者会丢掉所有hide_from_ui消息。

### 5、_matched_names方法

这是匹配逻辑的核心。

没有目录哈希或没有路由索引时直接返回空。

方法先找最新用户消息。

然后取文本。

取文本用的是get_original_user_content_text。

这个函数优先读original_user_content。

这样上传附件前缀不会污染匹配文本。

匹配用casefold做大小写无关的包含判断。

命中的工具按优先级降序排序。

优先级相同时按名称排序。

返回前top_k个名称。

### 6、_state_update方法

这个方法生成状态更新。

先算匹配的工具名。

没有匹配就返回None。

有匹配就读当前promoted状态。

promoted状态的目录哈希与当前目录哈希一致时才读已提升名单。

不一致说明工具目录变了，旧提升名单作废。

然后调用record_tool_promotion记录提升审计事件。

事件的生产者是本中间件。

钩子是before_model。

来源是routing_hint。

只记录新提升的名称，已提升的名称不重复记录。

最后返回promoted状态更新。

状态更新的结构是目录哈希加工具名列表。

### 7、before_model和abefore_model钩子

这两个钩子都调用_state_update。

同步路径和异步路径共用同一套逻辑。

### 8、assert_mcp_routing_before_deferred_filter函数

这是一个装配期断言函数。

它检查McpRoutingMiddleware在中间件列表里的位置。

提升必须发生在schema过滤之前。

如果路由中间件排在过滤中间件之后，这个函数直接抛RuntimeError。

这样错误的装配在启动时就失败，而不是运行时悄悄失效。

## 三、它和谁协作

这个中间件在中间件链里是lead专属的中间件。

它在lead_agent的build_middlewares里装配。

位置在DeferredToolFilterMiddleware之前。

assert_mcp_routing_before_deferred_filter函数保证这个顺序。

依赖message_utils的is_genuine_user_message判断真实用户消息。

依赖tool_promotion_audit_middleware的record_tool_promotion记录提升审计。

依赖tool_search_config的clamp_auto_promote_top_k夹取top_k。

依赖utils.messages的get_original_user_content_text取原始用户文本。

它写入的promoted状态是DeferredToolFilterMiddleware的输入。

被提升的工具从DeferredToolFilterMiddleware那里获得放行。

新的工具名提升时会发出middleware:tool_promotion审计事件，来源是routing_hint。

重复的名称不重复发事件。

## 重要性评级

评级是6分。

理由如下。

tool_search的延迟装配是MCP工具管理的重要机制。

没有路由提示时，模型必须先调tool_search再调业务工具，多花一轮调用。

这个中间件节省了这一轮，改善了MCP工具的可用性。

它还带装配期断言，防止错误装配悄悄失效。

所以评级是6分。

不评更高分的理由是这个中间件是纯优化。

没有它，tool_search仍然完整可用，只是多一步。

它只在tool_search.enabled时才有意义。

也不评低分，因为路由索引匹配直接影响模型能否用上MCP工具。
