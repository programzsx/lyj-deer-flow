# deerflow.agents.memory.backends.mem0.client-档案

## 一、这个模块是干什么的

这个文件是mem0后端的HTTP客户端。

这个客户端对接mem0平台的RESTAPI。

API版本主要是v3。

删除接口是v1。

mem0可以是用官方托管服务，也可以是API兼容的自建服务器。

MemoryManager契约是同步的。

原因是deer-flow的LLM调用也是同步的。

所以这个客户端用普通的httpx.Client。

客户端在构造时接收可选的transport参数。

transport参数是给测试用的。

测试可以注入httpx.MockTransport来模拟服务器。

## 二、模块里的主要成员

### 1、Mem0APIError类

Mem0APIError是一个异常类。

Mem0APIError继承自RuntimeError。

Mem0APIError表示任何mem0请求失败。

失败来源包括传输错误和4xx、5xx响应。

### 2、Mem0AuthError类

Mem0AuthError继承自Mem0APIError。

Mem0AuthError专门表示401错误。

401指API密钥缺失或无效。

单独区分401是有意的。

上层可以根据错误类型给出更准确的提示。

### 3、Mem0Client类

Mem0Client是本文件的核心类。

Mem0Client是对deer-flow用到的mem0接口的薄封装。

#### （1）__init__方法

__init__接收base_url、api_key、timeout_seconds和可选transport。

请求头使用Token令牌格式。

请求头还带Accept为application/json。

base_url会去掉末尾斜杠。

#### （2）close方法

close释放底层HTTP连接池。

#### （3）_request方法

_request是所有请求的公共出口。

_request把httpx.HTTPError转成Mem0APIError。

_request单独处理401。

401抛Mem0AuthError。

401的错误信息提示检查API密钥。

4xx和5xx抛Mem0APIError。

错误信息带上状态码和响应文本前200字符。

响应体为空时返回空字典。

响应体解析JSON失败时抛Mem0APIError。

#### （4）add_memories方法

add_memories提交一批消息给mem0。

mem0在服务端异步做事实提取。

响应里带一个event_id。

本后端不轮询这个event_id。

这是fire-and-forget设计。

请求体可以带user_id、agent_id、run_id。

#### （5）search_memories方法

search_memories做语义搜索。

请求体带query、filters、top_k、threshold。

返回值从响应的results字段取出。

#### （6）list_memories方法

list_memories列出记忆。

list_memories跨页遍历。

每页大小默认200。

遍历直到没有下一页，或达到max_items上限。

max_items达到后截断返回。

#### （7）delete_all_memories方法

delete_all_memories删除一整个桶。

删除走v1接口。

参数里只有非空的id会带上。

参数可以是user_id、agent_id、run_id的组合。

#### （8）ping方法

ping是启动时的认证检查。

ping用一个哨兵用户id请求1条列表。

哨兵id是__deerflow_startup_check__。

这个桶永远是空的。

所以ping证明了API密钥可用，又不碰真实数据。

## 三、它和谁协作

它被同目录mem0_manager.py里的Mem0Manager调用。

Mem0Manager的写入、搜索、列表、删除都落到这个客户端。

它被测试代码通过transport参数注入MockTransport来测试。

它对话外部mem0服务器。

它不依赖config.py。

它的参数全部由manager从Mem0Config解析后传入。

## 四、重要性评级

评级是7分。

理由是这个文件是mem0后端唯一的外部通信通道。

没有这个客户端，mem0后端完全无法工作。

401单独区分、ping启动检查、跨页遍历这些细节都在这里。

不评更高分的原因是它只是薄封装。

复杂度在mem0服务器和管理器层。
