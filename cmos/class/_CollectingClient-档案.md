# _CollectingClient-档案

## 一、这个类是干什么的

_CollectingClient是tools/builtins/invoke_acp_agent_tool.py里的内部类。

它继承acp的Client。

它是最小ACP Client。从session updates收集流式文本。

这个类位于backend/packages/harness/deerflow/tools/builtins/invoke_acp_agent_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_chunks

文本块列表。

collected_text属性把所有块拼接。

### 2、session_update方法

它处理session更新。

update的session_update是agent_message_chunk且content是TextContentBlock时追加文本。

异常被吞。提取是best effort。

### 3、request_permission方法

它处理权限请求。

_build_permission_response构建响应。auto_approve来自agent配置。

outcome是selected时记录info。ACP权限自动批准。

否则记录warning。提示设置auto_approve_permissions: true。

### 4、在build_invoke_acp_agent_tool里的角色

它是闭包内定义的。

每次ACP agent调用创建一个实例。

## 三、它和谁协作

- acp包的Client协议。
- _build_permission_response构建权限响应。
- agent_config提供auto_approve_permissions。

## 四、重要性评级

评级是3分。

理由如下。

这个类是ACP会话文本收集器。

只收集agent_message_chunk的TextContentBlock。

权限响应处理自动批准和拒绝。

闭包内部类。

扣掉7分。

扣分原因是它是闭包内部的收集器。逻辑量小。
