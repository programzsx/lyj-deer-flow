# Mem0Client-档案

## 一、这个类是干什么的

Mem0Client是agents/memory/backends/mem0/client.py里的类。

它是mem0 REST API的同步httpx客户端。v3。delete是v1。

MemoryManager契约是同步的。DeerMem的LLM调用也是同步。

所以这个客户端是纯httpx.Client。

这个文档覆盖Mem0Client加Mem0APIError、Mem0AuthError。

位于backend/packages/harness/deerflow/agents/memory/backends/mem0/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

base_url去掉尾部斜杠。

Authorization是Token {api_key}。这是mem0 v3的认证形式。

transport参数存在是为了测试注入httpx.MockTransport。

### 2、close方法

关闭HTTP客户端。

### 3、_request方法

状态码401抛Mem0AuthError。

状态码400以上抛Mem0APIError。body截断200字符。

空响应体返回空dict。

JSON畸形抛Mem0APIError。

### 4、add_memories方法

POST /v3/memories/add/。

服务端异步排队提取。响应带event_id。

body带messages加可选user_id、agent_id、run_id。

### 5、search_memories方法

POST /v3/memories/search/。

body带query、filters、top_k、threshold。

返回results列表。

### 6、list_memories方法

POST /v3/memories/。跨页列举直到耗尽或max_items到达。

page_size默认200。

### 7、delete_all_memories方法

DELETE /v1/memories/。v1端点。

params只带非空的作用域字段。

### 8、ping方法

启动时认证检查。

对一个sentinel user id做1条列举。

证明API key有效。不碰真实数据。sentinel bucket总是空。

## 三、它和谁协作

- Mem0Manager调用它。
- httpx做HTTP。
- 测试注入MockTransport。

## 四、重要性评级

评级是4分。

理由如下。

这个类是mem0远端memory的HTTP客户端。

401和普通错误分开。Mem0AuthError单独。

ping用sentinel bucket证明认证。不碰真实数据。

分页列举有max_items边界。

错误body截断200字符。

扣掉6分。

扣分原因是它是薄HTTP wrapper。作用域限于mem0后端。
