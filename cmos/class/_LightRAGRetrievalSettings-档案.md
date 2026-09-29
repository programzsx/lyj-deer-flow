# _LightRAGRetrievalSettings-档案

## 一、这个类是干什么的

_LightRAGRetrievalSettings是community/lightrag/tools.py里的pydantic模型。

它是存储在knowledge_search工具条目上的验证provider设置。

它配置LightRAG检索的连接和预算。

这个类位于backend/packages/harness/deerflow/community/lightrag/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、model_config

validate_default为True。默认值也被验证。

### 2、字段

base_url是AnyHttpUrl。默认http://localhost:9621。

api_key是SecretStr。可None。SecretStr防止意外打印。

mode是naive、local、global、hybrid、mix之一。默认mix。

bypass被排除。LightRAG的QueryRequest也接受bypass。它跳过索引直接从LLM回答。那会打败一个检索工具。

timeout默认30秒。大于0最多600。

top_k默认60。1到1000。服务器在MAX_QUERY_TOP_K=1000封顶。匹配那个限制而不是发明更紧的客户端限制。

chunk_top_k可None。1到1000。

max_chars_per_chunk默认800。1到100000。

max_total_chars默认8000。1到1000000。

### 3、_reject_url_userinfo验证器

base_url不能包含username或password信息。

防止凭据进URL。

### 4、_api_key函数

LightRAG可以不认证运行。缺失key保持有效。

空白值当未配置。不拒绝。

SecretStr取get_secret_value。

### 5、_redact_api_key函数

错误路径遮蔽api_key。替换为[REDACTED]。

### 6、_settings_from_extra函数

它从工具配置的model_extra构建设置。

## 三、它和谁协作

- knowledge_search工具条目持有它。
- LightRAGClient用它构建连接。
- format_retrieval_result格式化结果。

## 四、重要性评级

评级是5分。

理由如下。

这个类是LightRAG检索配置的验证边界。

bypass被排除。防止检索工具被绕过。

base_url拒绝userinfo。api_key是SecretStr。

top_k匹配服务器限制。

字符预算有边界。

这些质量不错。

扣掉5分。

扣分原因是它是单工具的配置模型。
