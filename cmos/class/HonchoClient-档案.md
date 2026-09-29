# HonchoClient-档案

## 一、这个类是干什么的

HonchoClient是agents/memory/backends/honcho/client.py里的类。

它是最小同步Honcho v3 HTTP客户端。给memory后端用。

依赖刻意轻。纯httpx对v3 REST API。

peers和sessions是服务端get-or-create。所以这里的每个调用都是幂等的。

这个文档覆盖HonchoClient加HonchoRequestError。

位于backend/packages/harness/deerflow/agents/memory/backends/honcho/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

config是HonchoConfig。

api_key存在时加Bearer Authorization header。

httpx.Client带base_url、headers、timeout。timeout是timeout_seconds加connect_timeout_seconds分开。

transport参数存在是为了测试注入httpx.MockTransport。Mem0Client先例。

### 2、close方法

关闭HTTP客户端。

### 3、_post方法

POST并raise_for_status。

httpx.HTTPError映射为HonchoRequestError。消息带path。

有响应体时解析JSON。非JSON抛HonchoRequestError。

空响应体返回None。

### 4、get_or_create_peer方法

POST /v3/workspaces/{workspace}/peers。带peer id。

### 5、get_or_create_session方法

POST /v3/workspaces/{workspace}/sessions。带session id。

### 6、set_session_peers方法

POST sessions/{session_id}/peers。peer_id映射到空对象。

### 7、add_messages方法

POST sessions/{session_id}/messages。带消息列表。

### 8、working_representation方法

POST peers/{peer_id}/representation。max_conclusions默认25。

返回representation文本。缺失时空字符串。

### 9、search方法

POST /v3/workspaces/{workspace}/search。query加limit。

返回list。data不是list时返回空列表。

## 三、它和谁协作

- HonchoMemoryManager调用它。
- HonchoConfig提供base_url、api_key、超时。
- httpx做HTTP。
- 它被asyncio.to_thread从async方法offload。

## 四、重要性评级

评级是4分。

理由如下。

这个类是Honcho远端memory的HTTP客户端。

v3 REST API。peers和sessions幂等。

连接超时和请求超时分开。

transport注入支持测试。

错误收敛为HonchoRequestError。

扣掉6分。

扣分原因是它是薄HTTP wrapper。作用域限于Honcho后端。
