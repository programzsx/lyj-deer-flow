# _InvokeACPAgentInput-档案

## 一、这个类是干什么的

_InvokeACPAgentInput是tools/builtins/invoke_acp_agent_tool.py里的pydantic模型。

它是invoke_acp_agent工具的输入契约。

这个文档覆盖_InvokeACPAgentInput加_CollectingClient。

位于backend/packages/harness/deerflow/tools/builtins/invoke_acp_agent_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

agent是要调用的ACP agent名字。

prompt是发送给agent的简洁任务提示。

### 2、_CollectingClient

它继承acp的Client。

它是最小ACP Client。从session updates收集流式文本。

_chunks收集文本块。collected_text属性拼接。

session_update处理agent_message_chunk。TextContentBlock文本被追加。

request_permission构建permission响应。

auto_approve_permissions为True时自动批准。

非selected的outcome记录warning。提示在config.yaml设置auto_approve_permissions: true。

### 3、_get_work_dir

每个thread有隔离的ACP workspace目录。

{base_dir}/threads/{thread_id}/acp-workspace/。

并发session不能读写彼此的ACP agent输出。

thread_id不可用时fallback到legacy全局目录。

目录不存在时自动创建。

### 4、_build_acp_mcp_servers

它从DeerFlow启用的MCP servers构建ACP mcpServers配置。

配置无效时继续但不带MCP servers。

### 5、环境变量展开

agent_config.env里以$开头的值从环境变量解析。

## 三、它和谁协作

- build_invoke_acp_agent_tool用它做输入schema。
- acp包提供Client协议。
- agent config提供command、args、env。

## 四、重要性评级

评级是4分。

理由如下。

这个类是ACP agent调用的输入契约。

两个字段。agent加prompt。

_CollectingClient收集流式文本并处理权限。

per-thread workspace隔离。并发session不互相干扰。

这些支撑ACP agent集成。

扣掉6分。

扣分原因是它是小输入模型。
