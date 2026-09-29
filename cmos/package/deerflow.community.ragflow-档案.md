# deerflow.community.ragflow档案

本文档介绍deerflow.community.ragflow包。

本文档基于对`backend/packages/harness/deerflow/community/ragflow/`目录的实际代码阅读。

本文档的读者是想理解这个包的开发者。

## 一、这个包是干什么的

这个包是RAGFlow的工具集成。

RAGFlow是一个开源的检索增强生成引擎。

用户可以自己部署一套RAGFlow服务器。

用户在RAGFlow里建知识库。

知识库在RAGFlow里叫dataset。

用户把文档灌进知识库。

RAGFlow会把文档切块并建索引。

这个包让DeerFlow的AI代理能够搜索这套RAGFlow知识库。

AI代理调用`knowledge_search`工具。

工具先解析要搜哪些知识库。

工具再向RAGFlow服务器发检索请求。

RAGFlow返回相关的文本块。

工具把文本块格式化成带引用的文本。

文本和引用证据一起回到AI代理手里。

这个包是只读的。

这个包只做检索。

这个包不修改RAGFlow里的任何数据。

这个包是community里功能最重的知识库集成之一。

## 二、包里的主要成员

包里有5个Python文件。

`__init__.py`是空的。

其余4个文件各管一层。

### 1、client.py里的RAGFlowClient

`RAGFlowClient`是最小化的异步HTTP客户端。

客户端基于httpx实现。

客户端故意不持有缓存。

客户端不持有任何持久状态。

客户端每次方法调用都新开一个HTTP会话。

所有请求都打到`{base_url}/api/v1`前缀下。

所有请求都带`Authorization: Bearer <api_key>`头。

客户端有3个核心方法。

#### （1）list_datasets

`list_datasets`解析知识库列表。

这个方法有两种用法。

给`dataset_id`参数时，只解析这一个知识库。

不给参数时，分页枚举所有知识库。

枚举每页100条。

枚举最多100页。

有个实现细节值得注意。

RAGFlow的单数`id`过滤器对不存在的知识库返回通用错误码。

这个错误码无法和其他提供商故障区分开。

RAGFlow的复数`ids`过滤器对不存在的知识库返回成功的空列表。

所以客户端用`ids`过滤器。

这样调用者能准确识别出"绑定的知识库不存在"。

同时保留所有真实的API错误。

#### （2）list_documents

`list_documents`代理一次文档列表请求。

这个方法主要被文档校验流程使用。

#### （3）retrieve

`retrieve`从明确的知识库白名单检索文本块。

`dataset_ids`必须非空。

`document_ids`可选，用来限定文档范围。

请求打到`POST /retrieval`端点。

客户端还定义了3个错误类。

- `RAGFlowError`是基类。
- `RAGFlowAPIError`表示RAGFlow返回了非零业务码。
- `RAGFlowConnectionError`表示连不上或者超时。
- `RAGFlowProtocolError`表示响应格式无效。

错误信息同样做API密钥脱敏。

### 2、formatting.py里的格式化函数

formatting.py有两个格式化函数。

#### （1）format_retrieval_result

`format_retrieval_result`把检索结果格式化成紧凑的引用文本。

每条文本块变成`[编号] 知识库名 / 文档名 (score 0.85)\n内容`的形式。

数据集ID会被映射回操作员配置的名字。

相似度分数带在引用头里。

内容截断规则和LightRAG包一致。

单块默认800字符。

全文默认8000字符。

#### （2）format_retrieval_sources

`format_retrieval_sources`是更重要的那个函数。

这个函数把结果拆成两部分。

一部分是模型可见的引用文本。

一部分是工件里的证据快照。

引用文本用`[citation:N](#knowledge-<id>)`链接格式。

链接指向工件里的证据记录。

证据快照放在`artifact.knowledge_sources`里。

版本是version 1。

每条source记录包含这些字段。

- `id`是每次检索唯一的引用ID。
- `provider`固定是ragflow。
- `dataset_id`、`document_id`、`chunk_id`是提供商定位符。
- `dataset_name`、`document_name`是人类可读名字。
- `text`是模型实际看到的摘录。
- `truncated`标记摘录是否被截断。
- `pages`是文档页码列表。

只有真正进入文本的条目才有source记录。

工件保留的摘录和模型看到的完全一致。

工件不会装下无限的原始载荷。

定位符不完整的块不会成为"已验证"的source。

不受信任的名字被挡在Markdown标签外面。

这样避免链接注入。

如果响应是旧版格式。

这个函数会退回到`format_retrieval_result`。

退回时返回None作为工件。

### 3、sources.py里的子代理证据转发

sources.py处理子代理结果的证据转发。

这个文件有两个函数。

#### （1）budget_source_artifact

`budget_source_artifact`把证据记录控制在输出预算内。

预算的规则是这样的。

已有的source ID下的摘录永远不会被缩短。

因为这些ID也出现在已持久化的子消息里。

超大的记录会被整体省略。

省略时加一条omission提示。

完整的省略提示会被保留。

不会输出半截的source链接。

与证据无关的artifact字段会保留。

任务结果可以保留一段简短的概述。

概述里的旧知识链接会被替换。

#### （2）cited_source_artifact

`cited_source_artifact`从子消息里收集子代理最终结果实际引用的source。

只有`knowledge_search`和`task`两种工具消息会被检查。

只有内容里真正出现了`#knowledge-<id>`链接的source才会被收集。

收集有上限。

最多100条source。

总共最多100万字符。

### 4、tools.py里的knowledge_search工具

tools.py是这个包的主体。

文件里有配置模型、知识库解析、检索分组、结果合并和Agent工具。

#### （1）_RAGFlowRetrievalSettings配置模型

`_RAGFlowRetrievalSettings`是pydantic模型。

模型定义了这些配置项。

- `datasets`是操作员配置的知识库ID白名单，最多100个。
- `base_url`是RAGFlow服务器地址，默认`http://localhost:9380`。
- `api_key`是API密钥，用SecretStr保护。
- `timeout`是超时，默认30秒。
- `page_size`是单次返回块数，默认8。
- `similarity_threshold`是相似度阈值，默认0.2。
- `vector_similarity_weight`是向量相似度权重，默认0.3。
- `top_k`是召回上限，默认256。
- `max_chars_per_chunk`和`max_total_chars`是格式化限制。

和LightRAG不同。

RAGFlow的api_key是必需的。

缺api_key会直接报错。

错误信息建议用`$RAGFLOW_API_KEY`环境变量。

`datasets`配置为空列表会报错。

想搜全部知识库就应该不配置`datasets`。

#### （2）知识库解析

`_resolve_datasets`负责解析本次要搜的知识库。

解析有三种路径。

第一种是本次请求指定了知识库ID。

这时先检查操作员白名单。

白名单外的知识库会被拒绝。

然后逐个验证知识库存在且可访问。

第二种是没配置`datasets`且本次没指定。

这时枚举所有可访问的知识库。

第三种是配置了`datasets`且本次没指定。

这时按配置的白名单解析。

任何一条解析失败都会返回明确的错误。

错误会指出第几个条目有问题。

#### （3）检索分组与合并

RAGFlow的一个限制驱动了分组逻辑。

一次检索只能用一个embedding模型。

多个知识库可能用不同的embedding模型。

`_group_scoped_datasets`按embedding模型给知识库分组。

限定文档的知识库和不限定的也分开。

`_retrieve_dataset_groups`并发检索每个组。

并发上限是4。

`_merge_group_results`合并各组结果。

合并有一个关键细节。

不同embedding空间的相似度分数没有全局可比性。

所以多组结果不比较原始分数。

每组保留提供商排好的顺序。

按名次交错合并。

多组时跨组的分数会被隐藏。

#### （4）文档过滤校验

`_validate_document_filters`校验本次限定的文档。

每个知识库的文档ID按最多100个分批。

所有批次共享4的并发预算。

这样避免放大提供商请求量。

文档必须满足三个条件。

- 文档必须存在。
- 文档的run状态必须是DONE。
- 文档的chunk_count必须大于0。

任何一个文档不满足就拒绝整个检索范围。

#### （5）knowledge_search工具

`knowledge_search_tool`是暴露给AI代理的LangChain工具。

工具的入口是`_knowledge_search_entrypoint`。

入口带`runtime`参数。

入口返回`content_and_artifact`格式。

也就是正文加工件。

工具支持每轮的知识范围控制。

运行时上下文里可以带`KNOWLEDGE_SCOPE_RUNTIME_KEY`。

知识范围有三种模式。

- disabled模式：本轮禁止知识检索。
- selected模式：本轮只搜选定的知识库和文档。
- 其他情况：按配置默认。

`knowledge_search`函数也支持直接调用。

直接调用时保留纯字符串API。

#### （6）list_knowledge_bases工具

`list_knowledge_bases_tool`列出可访问的知识库名字。

这个工具故意不暴露UUID。

模型只看到知识库名字。

## 三、它和谁协作

这个包依赖这些外部事物。

- 依赖一台用户自己部署的RAGFlow服务器（默认`http://localhost:9380`）。
- 依赖`deerflow.config`的`get_app_config`读取工具配置。
- 依赖`deerflow.knowledge_scope`做每轮知识范围控制。
- 依赖`deerflow.tools.types`的Runtime类型。
- 依赖httpx做HTTP请求。
- 依赖langchain_core的StructuredTool注册成Agent工具。

这个包被这些地方调用。

AI代理在对话中调用`knowledge_search`和`list_knowledge_bases`工具。

sources.py的转发函数被子代理结果处理路径调用。

格式化输出和LightRAG包共享同一套引用形状。

测试在`backend/tests/test_ragflow_tools.py`。

## 四、重要性评级

评级：7分。

理由是这样的。

这个包是community里最完整的知识库集成。

这个包有完整的citation证据体系。

模型可见的引用链接能解析到工件里的证据快照。

证据快照还会跨子代理边界转发。

这是RAGFlow包独有的能力。

这个包的工程质量很高。

知识库按embedding模型分组检索。

跨模型的分数不做无意义的比较。

文档校验分批并发。

错误处理和密钥脱敏都很完善。

私有文档问答是AI代理的重要场景。

这个包让DeerFlow具备了访问RAGFlow知识库的能力。

但是这个包是可选依赖。

用户必须自己部署RAGFlow服务器。

用户必须自己配置api_key。

不配置这个包，DeerFlow照常运行。

所以综合评级是7分。
