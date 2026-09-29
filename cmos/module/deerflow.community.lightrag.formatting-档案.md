# 模块档案：deerflow.community.lightrag.formatting

## 一、这个模块是干什么的

这个模块做LightRAG检索结果的格式化。
格式化的目标是紧凑的、带引用编号的文本。
LightRAG的/query/data端点返回很多字段。
包括chunks、entities、relationships、references。
DeerFlow的知识工具要把它变成模型可读的文本。
这个模块负责这个转换。
它的几个设计决策。
第一个决策是只输出chunks。
实体和关系被故意丢掉。
因为chunks是文档文本。
选中的查询模式已经把相关的排过序了。
保持输出紧凑能保住和RAGFlow提供商共享的引用形状。
第二个决策是不输出不透明的内部标识。
chunk_id和响应局部的reference_id永远不输出。
标注引用用的是运营者可读的file_path。

## 二、模块里的主要成员

（1）format_retrieval_result
这是模块的核心函数。
它把一个LightRAG /query/data载荷格式化成紧凑的带引用文本。
参数有两个截断限制。
max_chars_per_chunk默认800。
max_total_chars默认8000。
消费的字段名和LightRAG v1.5.7源码树交叉核对过。
端点在v1.4.8就存在。
但引用字段是v1.4.9引入的。
处理流程是这样的。
先取chunks。
没有chunks就返回"No relevant content found."。
然后从references建立reference_id到file_path的映射。
然后逐个chunk格式化。
每个chunk先找file_path。
chunk自己没有file_path就从references映射里查。
找不到就用"Unknown document"。
每个条目是编号加文档名加内容。
内容截断到每块上限。
最后汇总命中的文档。
每个文档带chunk计数。
总长度超限时追加截断标记。

（2）内部辅助函数
_truncate截断字符串。
带省略号标记。
超短上限时直接取标记的前缀。
_chunks过滤出合法的chunk列表。
不是列表返回空列表。
非Mapping的成员被过滤。
_reference_file_paths建立引用映射。
只收字符串类型的reference_id和file_path。

## 三、它和谁协作

这个模块依赖谁。
只依赖标准库。

谁调用这个模块。
同目录的tools.py调用它。
knowledge_search工具把检索结果交给它格式化。
它输出的是模型可见的带引用文本。

## 四、重要性评级

评级：4分。
理由：这是LightRAG检索结果的展示层。它决定模型实际看到什么。设计决策清晰。只展示chunks。不暴露内部标识。用file_path标注引用。字段名和上游版本核对过。截断逻辑完备。但它是可选知识检索功能的格式化层。职责单一。给4分。
