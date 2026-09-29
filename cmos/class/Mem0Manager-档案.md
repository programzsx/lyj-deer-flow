# Mem0Manager-档案

## 一、这个类是干什么的

Mem0Manager是agents/memory/backends/mem0/mem0_manager.py里的类。

它继承MemoryManager。

它是由mem0平台API支撑的内存后端。

它是无状态的HTTP MemoryManager。

所有状态在server端。mem0做去重、提取、存储。

这个后端不保留queue、watermark或cache。

所以多worker Gateway部署安全。

身份1:1映射。

(user_id, agent_name)映射到mem0的(user_id, agent_id)。

thread_id映射到mem0的run_id。

supports_search为True。

requires_passive_writes_in_tool_mode为True。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/mem0/mem0_manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_build_filters辅助函数

它从可用身份部分构建mem0 filters对象。

user_id、agent_name、run_id。

没有实体id时返回None。

mem0要求至少一个。

多个时用AND组合。

### 2、错误策略

_read_or_fallback是读门。

read_policy为fail_open时日志并返回fallback。

否则抛MemoryReadError。

_write_or_drop是写门。

write_policy为log_and_drop时日志并丢弃更新。

否则抛MemoryManagerError。

### 3、add方法

add提交过滤后的会话给mem0做server端提取。

fire-and-forget。mem0异步处理。response的event_id不被轮询。

thread_id映射run_id。总是满足mem0至少一个实体id的要求。

消息先经过filter_messages_for_memory过滤。

role映射human到user。ai到assistant。

### 4、get_context方法

get_context是query-less recall。

这个后端忽略可选的query提示。

注入桶里最近的记忆。top_k。

query感知recall在tool mode通过search可用。

注入截断按条目边界。

只保留完整放进剩余预算的记忆。

加1给连接换行。

注入永远不以悬空的部分行结束。

超长条目被跳过。更短的后面条目可能放得下。

所有记忆都超预算时警告。

返回空context。

不注入部分fact。

### 5、search和get_memory

search按query搜索。

category在filters的AND里加contains过滤。

结果映射成_to_fact。

_to_fact把mem0记录映射成中立的fact形状。

id、content、category、confidence、createdAt、source。

mem0的relevance score兼作confidence。

get_memory返回facts列表。

export_memory委托get_memory。

clear_memory清空桶。

delete_memory删除。

### 6、Mem0Client

client.py是mem0客户端。

Mem0APIError表示API错误。分Mem0AuthError等。

### 7、message_filtering

filter_messages_for_memory过滤要记忆的消息。

extract_message_text提取消息文本。

### 8、其他

from_config在fail_fast启动策略时ping验证。

close释放HTTP连接池。

异步方法都通过asyncio.to_thread offload。

## 三、它和谁协作

- MemoryManager是基类契约。
- Mem0Client是HTTP传输。
- Mem0Config提供配置。
- message_filtering过滤消息。
- agents/memory/tools.py消费fact形状。

## 四、重要性评级

评级是6分。

理由如下。

这个类是mem0内存后端的完整实现。

无状态设计适合多worker部署。

读和写失败策略分开配置。

注入截断按条目边界。永不部分行。

fact形状映射完整。

这些质量高。

扣掉4分。

扣分原因是它是可选外部后端。
