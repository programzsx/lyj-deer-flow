# 模块档案：deerflow.community.ragflow.client

## 一、这个模块是干什么的

这个模块定义RAGFlowClient类。
RAGFlow是一个检索增强生成平台。
它有知识库、文档、检索等概念。
这个客户端封装DeerFlow消费的RAGFlow API。
它是异步客户端。
底层用httpx。
客户端是极简的。
它刻意不持有缓存或持久状态。
每次方法调用都新开一个HTTP会话。
调用方不需要管理客户端生命周期。
API key作为Bearer授权头发送。
base_url会自动拼上/api/v1路径。
它支持三个能力。
列数据集。
列文档。
检索chunk。

## 二、模块里的主要成员

（1）异常类体系
RAGFlowError是基类。
RAGFlowAPIError表示RAGFlow返回了有效响应信封但code非零。
它携带code字段。
RAGFlowConnectionError表示连不上或超时。
RAGFlowProtocolError表示返回了无效或意外的HTTP响应。

（2）RAGFlowClient类
构造参数有base_url、api_key、timeout、transport。
默认超时30秒。
transport用于测试注入。
_redact把API key从文本里替换成[REDACTED]。
_request是所有请求的底层。
错误处理是这样的。
超时抛连接错误。
请求错误抛连接错误。
错误信息脱敏。
HTTP错误状态时尝试解析JSON错误载荷。
载荷里有非零code就抛API错误。
没有就抛协议错误。
响应不是JSON抛协议错误。
响应不是字典抛协议错误。
code不等于0抛API错误。

（3）list_datasets
这个方法解析数据集。
给了一个dataset_id时。
用ids过滤器查询单个数据集。
为什么用ids而不用id过滤器。
RAGFlow的id过滤器对不可访问或缺失的数据集返回通用的DATA_ERROR码。
这个码和好几种提供商失败无法区分。
ids过滤器对不可访问的id返回成功的空列表。
这样调用方可以把那个结果归类为缺失绑定。
同时保留所有真实的API错误。
没给dataset_id时。
分页枚举所有数据集。
每页100条。
最多100页。
用total字段判断什么时候取完。
total无效时用total_datasets字段兜底。
再无效就看本页是否短于页大小。

（4）list_documents
这个方法代理一个数据集的文档列表请求。

（5）retrieve
这个方法从显式的非空数据集允许列表检索chunk。
dataset_ids必须非空。
document_ids要么省略要么非空。
请求体带question、dataset_ids、page_size、similarity_threshold、vector_similarity_weight、top_k。
返回data字段。

## 三、它和谁协作

这个模块依赖谁。
只依赖httpx和标准库。

谁调用这个模块。
同目录的tools.py调用它。
knowledge_search工具构建这个客户端。
transport参数让测试可以注入假传输层。

## 四、重要性评级

评级：5分。
理由：这是RAGFlow知识检索的客户端核心。它的ids过滤器选择是一个经过深思的设计。它把缺失绑定和真实API错误区分开。分页枚举有total字段的多层兜底。错误处理带脱敏。客户端无状态。但它是可选集成的客户端层。给5分。
