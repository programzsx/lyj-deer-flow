# lightrag-knowledge-search-档案

## 一、这个类是干什么的

lightrag/tools.py不是单个类。

它是community/lightrag/目录下的工具模块。

它暴露knowledge_search工具。

搜索操作员配置的LightRAG实例。

返回紧凑的、引用编号的source chunk。

LightRAG没有dataset catalog可作用域。

部署的单一索引工作区总是被搜索。

用配置的检索模式。

所以唯一只读请求前没有绑定解析。

这个模块位于backend/packages/harness/deerflow/community/lightrag/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、knowledge_search函数

knowledge_search搜索配置的LightRAG实例。

query先规整。空的返回错误。

settings从配置解析。无效时返回错误。

client构建后调query_data。

mode、top_k、chunk_top_k来自settings。

结果用format_retrieval_result格式化。

API key redaction在成功路径也强制。

chunk和reference标识符永远不进入格式化文本。

### 2、_LightRAGRetrievalSettings

它是pydantic设置模型。

存在knowledge_search工具条目上。

包括base_url、api_key、mode、top_k、chunk_top_k等。

### 3、_api_key和_redact_api_key

_api_key从settings取凭证。

_redact_api_key把值里的密钥替换成REDACTED。

成功路径也redact。

### 4、_tool_error

它把异常转成redact后的错误字符串。

密钥不泄露。

### 5、工具描述

描述说明内部标识符永远不给模型看。

Compact citation-numbered source chunks。

配置的graph或vector模式。

### 6、ragflow对照

ragflow/tools.py更复杂。

_RAGFlowRetrievalSettings验证datasets、base_url、api_key。

SecretStr保存api_key。

base_url拒绝userinfo。

datasets规整。1到256字符。去重。

_resolve_datasets应用操作员allowlist和活dataset解析。

按embedding model分组检索。

文档过滤验证。run必须是DONE。chunk_count必须为正。

所有知识库的批次共用并发预算。

避免放大提供商请求量。

选中的文档缺失或不可搜索时返回错误。

sources.py的budget_source_artifact保持完整证据记录和链接在工具预算内。

摘录不在其source ID下缩短。

ID也出现在持久化子消息里。

超大记录原子省略。

cited_source_artifact只携带子结果里实际引用的源。

## 三、它和谁协作

- LightRAGClient是传输层。
- format_retrieval_result格式化输出。
- Ragflow的工具是同形状的对应提供者。
- knowledge scope的allowlist机制。

## 四、重要性评级

评级是5分。

理由如下。

这个模块是LightRAG知识检索的工具层。

API key redaction在成功路径也强制。

内部标识符不给模型。

settings验证完整。

RAGFlow侧的allowlist和文档过滤验证更严格。

并发预算防请求放大。

这些质量不错。

扣掉5分。

扣分原因是它是可选外部知识检索。
