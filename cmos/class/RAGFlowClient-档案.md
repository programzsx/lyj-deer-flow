# RAGFlowClient-档案

## 一、这个类是干什么的

RAGFlowClient是community/ragflow/client.py里的类。

它是DeerFlow只读检索工具的直接HTTP客户端。

RAGFlow是RAG知识库服务。

客户端刻意不拥有缓存或持久状态。

每个方法调用开新鲜HTTP会话。

调用方不需要管理客户端生命周期。

这个类位于backend/packages/harness/deerflow/community/ragflow/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、错误层级

RAGFlowError是异常基类。

RAGFlowAPIError是RAGFlow以带code的失败拒绝。

RAGFlowConnectionError是连接或超时失败。

RAGFlowProtocolError是无效或意外HTTP响应。

### 2、_redact方法

它把值转成文本并redact API key。

错误消息里永不泄露密钥。

### 3、_request方法

统一请求。

Bearer认证头。base_url加/api/v1。

超时抛ConnectionError。

请求错误redact后抛ConnectionError。

错误响应带code时抛APIError。

没有code时抛ProtocolError。

JSON畸形或非对象payload抛ProtocolError。

code非0时抛APIError。

### 4、list_datasets方法

它解析一个dataset ID。

或没有ID时枚举每页。

RAGFlow的单数id filter对不可访问或缺失dataset返回通用DATA_ERROR code。

和多个提供者失败无法区分。

它的ids filter对不可访问ID返回成功的空列表。

调用方能区分。

### 5、sources.py

sources.py是普通子代理结果间的有界source-artifact转发。

budget_source_artifact保持完整证据记录和链接在工具预算内。

摘录不在已有source ID下缩短。

那些ID也出现在持久化子消息里。

超大记录原子省略。

无关artifact字段存活。

任务结果可以在证据前保留短synopsis。

它的旧知识链接被保留的替换。

source ID必须匹配模式。

必须在content里有引用链接。

provider必须是ragflow。

保留完整省略通知。永不输出部分source链接。

cited_source_artifact只携带子最终结果里实际引用的源。

每个ID在content里必须有链接。

上限100个。总文本预算1000000。

### 6、formatting.py对照

ragflow/formatting.py格式化检索结果。

和lightrag共享引用形状。

### 7、ragflow/tools.py对照

ragflow/tools.py暴露knowledge_search工具。

带dataset allowlist和文档过滤验证。

## 三、它和谁协作

- RAGFlow服务是外部RAG后端。
- ragflow/tools.py的工具调用这个客户端。
- budget_source_artifact转发source artifact。
- knowledge scope机制。

## 四、重要性评级

评级是5分。

理由如下。

这个类是RAGFlow检索集成的传输层。

错误分层。API错误带code。

ids filter区分不可访问ID。

错误消息redact凭证。

source artifact转发的预算处理精细。

摘录ID在持久化消息里所以不缩短。

这些质量不错。

扣掉5分。

扣分原因是它是可选外部服务的薄客户端。
