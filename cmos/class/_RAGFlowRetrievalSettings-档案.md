# _RAGFlowRetrievalSettings-档案

## 一、这个类是干什么的

_RAGFlowRetrievalSettings是community/ragflow/tools.py里的pydantic模型。

它是存储在knowledge_search工具条目上的验证provider设置。

它配置RAGFlow检索的连接、范围和预算。

这个文档覆盖_RAGFlowRetrievalSettings加_ResolvedDataset、_RetrievalGroup。

位于backend/packages/harness/deerflow/community/ragflow/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、model_config

validate_default为True。默认值也被验证。

### 2、字段

datasets是dataset ID列表。最多100。可None。

None表示搜索所有可访问的dataset。配置了但为空抛错。

base_url是AnyHttpUrl。默认http://localhost:9380。

api_key是SecretStr。可None。

timeout默认30秒。大于0最多600。

page_size默认8。1到100。

similarity_threshold默认0.2。0到1。

vector_similarity_weight默认0.3。0到1。

top_k默认256。1到1024。

max_chars_per_chunk默认800。max_total_chars默认8000。

### 3、_normalize_dataset_ids验证器

datasets为None时返回None。

配置了但为空时抛错。提示省略它以搜索所有可访问dataset。

每个ID strip加长度检查。1到256字符。

去重保持输入顺序。

### 4、_reject_url_userinfo验证器

base_url不能包含username或password信息。

### 5、_ResolvedDataset

dataset_id、name、embedding_model、chunk_count。

冻结加slots。

它表示一个已解析的dataset。

### 6、_RetrievalGroup

embedding_model、dataset_ids、document_ids。

它把同一embedding model的dataset分组检索。

### 7、_redact_error函数

错误路径遮蔽provider凭据和不透明的dataset ID。

UUID模式替换为[DATASET_ID]。

### 8、并发边界

_MAX_PARALLEL_RAGFLOW_REQUESTS是4。

_MAX_DOCUMENT_IDS_PER_REQUEST是100。

文档验证每批最多100个ID。_bounded_gather限制并发为4。

## 三、它和谁协作

- knowledge_search工具条目持有它。
- RAGFlowClient用它构建连接。
- _RetrievalGroup按embedding model分组。

## 四、重要性评级

评级是5分。

理由如下。

这个类是RAGFlow检索配置的验证边界。

dataset ID验证加去重。空列表明确拒绝。

base_url拒绝userinfo。api_key是SecretStr。

_redact_error遮蔽凭据和dataset ID。

并发限制4。每批100个ID。

这些质量不错。

扣掉5分。

扣分原因是它是单工具的配置模型。
