# 模块档案：deerflow.community.lightrag.client

## 一、这个模块是干什么的

这个模块定义LightRAGClient类。
LightRAG是一个知识图谱加向量检索的服务。
它有自己的一套API。
这个客户端封装DeerFlow消费的LightRAG API。
它是异步客户端。
底层用httpx。
客户端是极简的。
它刻意不持有缓存或持久状态。
每次方法调用都新开一个HTTP会话。
调用方不需要管理客户端生命周期。
可选的API key作为X-API-Key请求头发送。
这是LightRAG文档对API key认证服务器记录的唯一凭据形式。
不认证的部署直接省略它。
它只支持只读检索。
调用POST /query/data端点。
这个端点不做LLM生成。
它返回实体、关系、chunk和引用。
这正是DeerFlow只读知识工具需要的形状。

## 二、模块里的主要成员

（1）异常类体系
LightRAGError是基类。
表示归一化后的LightRAG失败。
LightRAGAPIError表示LightRAG拒绝了请求。
失败原因可读。
LightRAGConnectionError表示连不上或超时。
LightRAGProtocolError表示返回了无效或意外的HTTP响应。
三个子类让调用方能区分错误类别。

（2）LightRAGClient类
构造参数有base_url、api_key、timeout。
默认超时30秒。
transport参数用于测试注入。
query_data方法运行一次只读结构化检索。
参数有query、mode、top_k、chunk_top_k。
mode默认hybrid。
mode必须属于五种之一。
naive、local、global、hybrid、mix。
_undocumented的bypass模式被排除。
bypass跳过索引直接问LLM。
那会毁掉一个检索工具的定位。

（3）错误处理
_request方法处理所有错误。
超时抛LightRAGConnectionError。
请求错误也抛它。
错误信息经过redact。
API key不出现在错误文本里。
404状态码有专门处理。
404意味着base_url写错了。
或者LightRAG版本低于v1.4.9。
那个版本之前/query/data端点不存在。
默认的Not Found响应体对两种情况都没帮助。
所以给专门提示。
旧版本检测还有一层。
v1.4.8用扁平的entities、relationships、chunks、metadata载荷。
状态加data的信封和带引用的chunk字段都是v1.4.9才有的。
遇到扁平载荷就提示升级。
_error_message从错误载荷提取可读消息。
LightRAG的错误可能在message字段。
也可能在detail字段。
detail是FastAPI的错误处理器。
可能是字符串。
也可能是验证对象列表。
列表里每个对象的msg字段是原因。
pydantic会在前面加"Value error, "前缀。
提取时去掉这个前缀。

## 三、它和谁协作

这个模块依赖谁。
只依赖httpx和标准库。

谁调用这个模块。
同目录的tools.py调用它。
tools.py里的knowledge_search工具构建这个客户端。
transport参数让测试可以注入假传输层。

## 四、重要性评级

评级：5分。
理由：这是LightRAG知识检索功能的客户端核心。它的错误处理写得非常细。版本检测、错误信息提取、API key脱敏都有明确处理。旧版本载荷的识别对排障很有价值。客户端刻意无状态，设计干净。但它是可选集成的客户端层。给5分。
