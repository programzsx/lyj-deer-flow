# LightRAGClient-档案

## 一、这个类是干什么的

LightRAGClient是community/lightrag/client.py里的类。

它是DeerFlow消费的LightRAG API的最小异步客户端。

LightRAG是图基础的RAG服务。

这个客户端服务于DeerFlow的只读检索工具。

它刻意不拥有缓存或持久状态。

每个方法调用开新的HTTP会话。

调用方不需要管理客户端生命周期。

可选API key以X-API-Key请求头发送。

这是LightRAG为API key认证服务器文档的唯一凭证形式。

无认证部署直接省略。

这个类位于backend/packages/harness/deerflow/community/lightrag/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、错误层级

LightRAGError是规整失败的基类。

LightRAGAPIError是LightRAG以可读失败拒绝请求。

LightRAGConnectionError是LightRAG无法到达或超时。

LightRAGProtocolError是LightRAG返回无效或意外的HTTP响应。

### 2、_redact方法

它把值转成文本并redact API key。

错误消息里永不泄露密钥。

### 3、_error_message方法

它从错误payload提取redact后的人类可读消息。

LightRAG失败在message字段带文本。

或detail字段。FastAPI错误处理器。

detail可以是字符串或验证对象列表。

其msg字段持有原因。前缀是pydantic的Value error。

其他结构化body、纯文本、缺失payload都返回None。

调用方回退到稳定的protocol错误。

不把原始JSON倒给模型。

### 4、_request方法

统一请求。

X-API-Key头带凭证。

超时时抛LightRAGConnectionError。

请求错误redact后抛ConnectionError。

404在data检索端点上意味着base_url错误或LightRAG低于v1.4.9。

那时/query/data还不存在。

默认Not Found body对两种情况都没帮助。

所以给可操作提示。

### 5、QUERY_MODES

查询模式是naive、local、global、hybrid、mix。

### 6、formatting.py

format_retrieval_result把/query/data payload格式化成紧凑引用文本。

每chunk上限800字符。总上限8000。

消费的字段名对照LightRAG v1.5.7源码树交叉检查。

端点v1.4.8发布。

v1.4.9才引入status/data envelope和引用字段。

不透明的内部标识符永不输出。

chunk_id和响应局部的reference_id。

操作员可读的file_path标注每个引用。

实体和关系故意丢弃。

chunks是查询模式已排序的相关文档文本。

保持输出紧凑。保留和RAGFlow提供者共享的引用形状。

### 7、tools.py对照

lightrag/tools.py暴露retrieval工具。

## 三、它和谁协作

- LightRAG服务是外部RAG后端。
- lightrag/tools.py的工具调用这个客户端。
- format_retrieval_result格式化输出。
- ragflow是同形状的对应提供者。

## 四、重要性评级

评级是5分。

理由如下。

这个类是LightRAG检索集成的传输层。

错误层级规整。

错误消息redact凭证。

404给可操作提示。

格式化保持紧凑引用形状。不透明id不输出。

版本对照检查交叉验证字段名。

这些质量不错。

扣掉5分。

扣分原因是它是可选外部服务的薄客户端。
