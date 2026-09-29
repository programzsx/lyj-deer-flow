# deerflow.agents.middlewares.tool_result_meta-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_result_meta.py。

## 一、这个模块是干什么的

这个模块不是中间件。

这个模块是工具结果的统一语义模块。

每个工具结果都会有一个结构化元数据。

元数据的键是deerflow_tool_meta。

元数据存放在ToolMessage的additional_kwargs里。

元数据告诉下游这个工具结果是成功还是失败。

失败时是什么类型的失败。

失败能不能被模型自己恢复。

模型下一步该做什么。

下游消费者读这个键。

下游消费者包括ToolProgressMiddleware。

下游消费者不需要解析工具结果的文本。

一句话总结。

这个模块把"读文本猜状态"变成"读结构化元数据"。

## 二、模块里的主要成员

### 1、核心数据结构和常量

TOOL_META_KEY的值是"deerflow_tool_meta"。

PROGRESS_GUARD_ERROR_TYPE的值是"blocked_by_progress_guard"。

ToolResultStatus是状态枚举。

状态枚举的值是success、error、partial_success。

RecommendedNextAction是下一步动作枚举。

动作枚举的值是continue、rewrite_query、try_alternative、summarize、stop。

ToolResultMeta是冻结的dataclass。

ToolResultMeta有五个字段。

字段一是status。

字段二是error_type。

字段三是recoverable_by_model。

字段四是recommended_next_action。

字段五是source。

source说明元数据是怎么得出的。

source的值是exception、tool_return、content_analysis、progress_middleware。

### 2、错误分类规则

_ERROR_RULES是错误分类规则表。

每条规则是一组关键词加一组属性。

规则按顺序匹配。

第一条命中的规则生效。

规则覆盖八类错误。

规则一是401、403、unauthorized等认证错误。

认证错误的error_type是auth。

认证错误不可恢复。

推荐动作是stop。

规则二是rate limit限流错误。

限流错误的error_type是rate_limited。

限流错误不可恢复。

推荐动作是summarize。

规则三是timeout、connection等瞬时错误。

瞬时错误的error_type是transient。

瞬时错误不可恢复。

推荐动作是try_alternative。

规则四是not configured、not installed等配置错误。

配置错误的error_type是config。

配置错误不可恢复。

推荐动作是stop。

规则五是permission denied、path traversal等权限错误。

权限错误的error_type是permission。

权限错误可恢复。

推荐动作是try_alternative。

权限错误可恢复的原因是模型可以换一个路径重试。

规则六是no results found等无结果错误。

无结果错误的error_type是no_results。

无结果错误可恢复。

推荐动作是rewrite_query。

规则七是not found、404等未找到错误。

未找到错误的error_type是not_found。

未找到错误可恢复。

推荐动作是rewrite_query。

规则八是unexpected error、500等内部错误。

内部错误的error_type是internal。

内部错误不可恢复。

推荐动作是stop。

没有任何规则命中就归为unknown。

unknown错误可恢复。

推荐动作是try_alternative。

### 3、数字关键词的词边界处理

数字关键词有401、403、404、500。

裸的数字匹配会有误伤。

比如"took 500ms"会被"500"误命中。

所以数字关键词用预编译的正则加词边界匹配。

正则在模块加载时预编译。

热路径上没有惰性写入。

### 4、_extract_json_error_text函数

这个函数从JSON包装的错误里提取error字段。

工具返回{"error": "...", "query": "..."}这种结构时。

分类只用error字段的值。

分类不用其他字段。

其他字段里可能偶然出现关键词。

比如query字段里有"missing required"。

不看其他字段就避免了误分类。

error字段是falsy时返回None。

error是"none"、"null"、"false"这类哨兵字符串时返回None。

这些哨兵值按惯例表示没有错误。

这个处理防止{"error": "none", "results": [...]}被误判成错误。

非字符串的error值会序列化成JSON。

这样分类函数看到的是可预测的格式。

### 5、_classify_error_shell函数

这个函数识别HTTP错误页面。

抓取一个不存在的URL在传输层是成功的。

所以前面的分支都不命中。

服务器的错误页面会带着status="success"进入模型。

这就是issue #4273的问题。

错误页面被当成了真证据。

这个函数的信号是提取的标题。

nginx、Apache、IIS、Cloudflare的错误页面都用状态行当标题。

正文只有服务器样板文字。

匹配用归一化后的全等。

匹配从不用子串。

这样只是"提到"某个状态的文档不会被误判。

"404 Ways to Cook Rice"会存活为成功。

"Not Found: a short history of the 404"也会存活为成功。

内容长度故意不参与判断。

用真实错误页测量过。

长度区分不开。

这个函数只是无提供者差异的兜底。

权威信号是提供者自己的状态码。

状态码留在web_fetch边界。

这个函数只对web_fetch生效。

web_capture故意不在范围里。

web_capture的结果是关于产物的工具消息。

不是渲染的页面。

标题规则不适用。

### 6、_as_status_line函数

这个函数把页面标题归约成裸的原因短语。

"404 Not Found"归约成"not found"。

"404 - File or directory not found."归约成"not found"。

"404 Ways to Cook Rice"归约成"ways to cook rice"。

剩下的词还活着。

所以它是一篇文档。

归约时会剥离前缀里的状态码和通用名词。

服务器会写"404 - File or directory not found"。

服务器也会写"HTTP Error 404 - Not Found"。

两种写法都要能归约。

### 7、stamp_exception_meta函数

这个函数给异常派生的ToolMessage打元数据。

source是exception。

这个函数和normalize_tool_message不同。

normalize_tool_message保留已有的戳。

stamp_exception_meta总是覆盖已有的戳。

异常派生的分类比工具自己的返回戳更权威。

### 8、normalize_tool_message函数

这个函数是核心。

它给没有元数据的ToolMessage附上元数据。

已有元数据的消息直接返回。

处理顺序如下。

第一步检查子智能体结构化失败。

subagent_status是failed、cancelled、timed_out、polling_timed_out时按错误处理。

这些生产者把权威状态放在additional_kwargs.subagent_status。

这些生产者把ToolMessage.status留在LangChain默认的success。

显示文本也不以"Error:"开头。

只看内容启发式会把它们误标成成功。

所以结构化字段优先于任何内容分析。

第二步处理非标准错误。

status是error但没有"Error:"前缀。

先尝试JSON提取。

没有error键的JSON对象不按原始字符串分类。

原始JSON字符串里的偶然字段值会造成误伤硬阻断。

内容不是合法JSON才按原始文本分类。

第三步处理"Error:"前缀。

前缀后的文本交给分类函数。

第四步尝试JSON提取。

第五步尝试HTTP错误页面识别。

第六步检查partial_success标记。

标记包括partial results、limited results、truncated等。

还包括no results found、no content found、no images found。

后三个标记覆盖返回status=success加无结果正文的工具。

这些工具也要被停滞检测抓住。

模型才会被提示换一个查询。

第七步兜底为success。

### 9、normalize_tool_result函数

这个函数是给中间件用的入口。

它透明处理Command包装。

参数是ToolMessage就直接归一化。

参数是Command就取出里面的messages。

提供了tool_call_id时只处理匹配的ToolMessage。

Command的其他字段和无关消息保持原样。

生产者提供的deerflow_tool_meta会被保留。

## 三、它和谁协作

这个模块是纯工具模块。

它没有中间件类。

它没有LangGraph钩子。

它被ToolErrorHandlingMiddleware调用。

每个经过ToolErrorHandlingMiddleware的工具结果都会被归一化。

它被ToolReceiptMiddleware间接依赖。

它被下游消费者读取。

下游消费者包括ToolProgressMiddleware。

ToolProgressMiddleware读这个键判断停滞。

它和AGENTS.md的约定协作。

AGENTS.md规定ToolErrorHandlingMiddleware通过normalize_tool_result给每个结果打deerflow_tool_meta。

元数据字段是status、error_type、recoverable_by_model、recommended_next_action、source。

## 重要性评级

评级是8分。

理由如下。

这个模块是工具结果的语义中枢。

停滞检测依赖它。

进度守卫依赖它。

回执机制依赖它。

没有它，下游只能靠解析文本猜工具结果的状态。

文本解析非常脆弱。

错误分类规则决定了模型能否从错误中恢复。

分类过严会让模型过早放弃。

分类过松会让模型在死路上打转。

这个模块的分类规则被精心设计。

词边界、JSON提取、错误页面识别、哨兵值处理都考虑到了。

所以评级是8分。

不评更高分的理由是它只产出元数据。

真正的动作执行在各守卫中间件里。
