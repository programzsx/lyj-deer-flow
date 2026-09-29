# 模块档案：deerflow.community.ragflow.formatting

## 一、这个模块是干什么的

这个模块做RAGFlow检索结果的格式化。
它提供两个格式化函数。
第一个把检索响应格式化成紧凑的带引用文本。
第二个把模型可见的引用和有界的、不可变的检索快照配对。
先说验证背景。
格式化逻辑对RAGFlow v0.26.4和v0.27.0验证过。
REST检索端点在返回前会归一化chunk字段。
例如kb_id会变成dataset_id。
这个模块只消费那些公开的响应字段名。
数据集ID会被映射回运营者配置的名字。
然后才到达模型。

## 二、模块里的主要成员

（1）format_retrieval_result
这个函数把一个RAGFlow检索响应格式化成紧凑的带引用文本。
参数有dataset_names_by_id和两个截断限制。
max_chars_per_chunk默认800。
max_total_chars默认8000。
处理流程是这样的。
先取chunks。
没有chunks返回"No relevant content found."。
然后从doc_aggs建立文档ID到文档名的映射。
然后逐个chunk格式化。
每个chunk取dataset_id映射回数据集名。
取document_id和document_keyword确定文档名。
找不到用Unknown document。
相似度分数带在引用标题后面。
分数无效就省略。
内容截断到每块上限。
最后汇总命中的文档。
每个文档带chunk计数。
总长超限追加截断标记。

（2）format_retrieval_sources
这个函数把模型可见的引用和有界的检索快照配对。
它返回一个元组。
第一个是文本。
第二个是artifact载荷。
artifact结构是knowledge_sources加version 1加sources列表。
关键设计点有这些。
引用标识独立于提供商ID。
每次调用唯一。
用uuid4生成。
只有实际进入文本的chunk才获得源记录。
artifact保留模型看到的同一份摘录。
绝不包含无界载荷。
数据集必须在配置的名称映射里才成为已验证的源。
不完整或超出范围的定位符不能变成已验证的源。
不信任的名字被redact处理。
并保持在Markdown标签外面。
避免链接注入。
旧版或不完整的提供商响应仍然产出可读文本。
回退到format_retrieval_result。
artifact为None。
chunk的positions字段提取页码。
页码有界。
每个位置数组最多100项。
页码范围1到1000000。

（3）内部辅助函数
_truncate截断字符串。
_document_aggregates提取文档聚合。
接受列表或字典两种形状。
_score解析分数。
布尔值不算分数。

## 三、它和谁协作

这个模块依赖谁。
只依赖标准库。

谁调用这个模块。
同目录的tools.py调用它。
knowledge_search工具用format_retrieval_sources产出内容和artifact。
用format_retrieval_result产出纯文本。

## 四、重要性评级

评级：5分。
理由：这是RAGFlow知识检索的展示层。format_retrieval_sources是引用快照机制的实现。仓库的AGENTS.md专门用一节描述这个机制。它把模型可见引用和artifact证据快照配对。链接注入防护、redact处理、有界载荷都有。字段名对上游版本验证过。给5分。
