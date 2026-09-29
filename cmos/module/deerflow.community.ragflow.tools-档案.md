# 模块档案：deerflow.community.ragflow.tools

## 一、这个模块是干什么的

这个模块定义只读的Agent工具。
工具名是knowledge_search。
它搜索运营者配置的RAGFlow数据集。
返回紧凑的、带引用编号的源chunk。
如果knowledge_search.datasets配置省略。
就搜索API key能访问的所有数据集。
数据集ID永远不展示给模型。
模型引用结果时要原样复制提供的[citation:N](#knowledge-...)链接。
不要发明或重新编号。
这个模块是RAGFlow知识检索的核心。
它处理数据集解析、文档过滤、检索分组、结果合并、引用产出。

## 二、模块里的主要成员

（1）knowledge_search_tool
这是Agent工具。
用StructuredTool构建。
response_format是content_and_artifact。
入口函数返回内容和artifact。
artifact是knowledge_sources引用快照。
还有list_knowledge_bases_tool。
它列出可访问的知识库名字。
不暴露UUID。

（2）_RAGFlowRetrievalSettings
这是Pydantic设置模型。
字段有datasets、base_url、api_key、timeout、page_size、similarity_threshold、vector_similarity_weight、top_k、max_chars_per_chunk、max_total_chars。
datasets最多100个。
base_url默认http://localhost:9380。
有验证器拒绝URL里的用户名密码。
datasets验证器做归一化。
去空白、去重、拒绝空配置。
配置了空列表报错。
省略表示搜全部。

（3）数据集解析
_resolve_datasets解析数据集范围。
分三种情况。
请求了数据集ID列表时。
先检查运营者允许列表。
选择超出允许列表就报错。
然后逐个验证。
缺失或不可访问就报错。
settings.datasets是None时。
枚举所有可访问数据集。
settings.datasets配置了时。
逐个解析配置的数据集。
缺失时报第几项配置有问题的错误。
_ResolvedDataset记录数据集的id、名字、嵌入模型、chunk数。
没有嵌入模型元数据的数据集有特殊处理。
空数据集跳过。
可搜索数据集缺元数据报协议错误。

（4）文档过滤验证
_validate_document_filters验证每个数据集选中的文档。
每个批次最多100个ID。
所有数据集的批次共用_bounded_gather的并发限制。
限制是4。
验证后的ID按输入顺序合并。
保留完整的检索范围。
任何批次错误、缺失文档、非可搜索文档都拒绝整个范围。
文档必须run状态是DONE且chunk_count大于0。

（5）检索分组与合并
_group_scoped_datasets按嵌入模型和是否有文档过滤分组。
不同嵌入模型的数据集分开检索。
因为不同嵌入空间的相似度分数不能全局比较。
_retrieve_dataset_groups并发检索各组。
_retrieve_group_results按排名交错合并各组结果。
每组保留提供商排好的顺序。
多组时隐藏跨组分数。
单组时保留分数。
还有_bounded_gather辅助函数。
它带信号量限制并发为4。
保留输入顺序。
任何一个请求失败整个失败。

（6）knowledge_search函数
这是实际执行检索的函数。
它支持knowledge_scope。
scope来自参数或runtime上下文。
scope有disabled和selected两种模式。
disabled时返回禁用提示。
selected时解析选中的数据集和文档过滤。
成功路径上API key脱敏强制。
UUID脱敏只在错误路径。
成功路径上有效校验和和trace ID要保留。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的client、formatting、sources模块。
依赖deerflow.knowledge_scope的scope处理。
依赖deerflow.config。
依赖pydantic。

谁调用这个模块。
DeerFlow的工具框架注册knowledge_search和list_knowledge_bases工具。
resolve_ragflow_retrieval_settings等公开函数也服务于安全的目录API。
config.yaml的tools列表里配置knowledge_search的RAGFlow设置才启用。
仓库的回归测试在tests/test_ragflow_tools.py。

## 四、重要性评级

评级：6分。
理由：这是RAGFlow知识检索的核心工具层。它处理数据集允许列表、文档过滤验证、跨嵌入模型分组、分数合并、引用快照等复杂逻辑。仓库的AGENTS.md用专门章节描述它的文档验证和引用机制。并发限制和批次大小有明确规则。它是可选知识集成的重点模块。给6分。
