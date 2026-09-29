# Mem0Client-档案

## 一、这个类是干什么的

Mem0Client是agents/memory/backends/mem0/client.py里的类。

它是mem0 REST API的同步httpx客户端。

v3 API。delete是v1。

MemoryManager契约是同步的。

DeerMem的LLM调用也是同步的。

所以这个客户端是普通httpx.Client。

构造时可选transport。

测试能注入httpx.MockTransport。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/mem0/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、Mem0APIError和Mem0AuthError

Mem0APIError是任何mem0请求失败。传输错误或4xx、5xx。

Mem0AuthError是401。缺失或无效API key。

### 2、Mem0Client本身

构造方法带base_url、api_key、超时、可选transport。

请求头是Token加api_key。

### 3、_request方法

统一请求。

httpx.HTTPError转Mem0APIError。

401抛Mem0AuthError并提示检查API key。

4xx以上抛APIError。响应文本截断200字符。

空响应返回空字典。

JSON畸形时抛APIError。

### 4、端点方法

add_memories排队提取。server端异步。response带event_id。

search_memories按query搜索。带filters、top_k、threshold。

list_memories跨页列出。直到穷尽或max_items达到。

delete_all_memories按user_id、agent_id、run_id删除。v1端点。

ping是启动auth检查。

1条列表限定在哨兵user id上。

证明API key可用。不碰真实数据。

哨兵桶总是空的。

### 5、message_filtering.py

message_filtering.py是mem0写路径的消息过滤。

DeerMem的filter_messages_for_memory规则的自包含镜像。

可移植规则禁止跨后端文件夹导入。

所以逻辑复制。不共享。

保留可见user输入、格式良好的human澄清答案、最终assistant响应。

丢弃框架内部hide_from_ui消息、tool-call AI消息、工具输出、空或仅上传的turn。

_upload_block_re删除current_uploads块。

## 三、它和谁协作

- Mem0Manager通过它调用mem0平台。
- Mem0Config提供base_url、api_key、超时。
- httpx是HTTP库。

## 四、重要性评级

评级是4分。

理由如下。

这个类是mem0后端的传输层。

错误分层清晰。401单独。

ping用哨兵桶验证auth。不碰真实数据。

分页列表有max_items界。

这些质量不错。

扣掉6分。

扣分原因是它是薄HTTP包装。

逻辑简单。
