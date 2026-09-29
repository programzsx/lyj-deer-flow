# invoke_acp_agent-档案

## 一、这个类是干什么的

invoke_acp_agent不是类。

invoke_acp_agent是tools/builtins/invoke_acp_agent_tool.py里的工具。

它是外部ACP兼容代理的调用工具。

ACP是Agent Client Protocol。

这个工具让DeerFlow代理调用外部ACP代理。

每个ACP代理在config.yaml里配置。

工具描述包含可用代理列表。

LLM不需要硬编码名字就知道能调用谁。

这个模块位于backend/packages/harness/deerflow/tools/builtins/invoke_acp_agent_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_InvokeACPAgentInput

这是args_schema。

- agent是要调用的ACP代理名。
- prompt是发给代理的简洁任务提示。

### 2、_get_work_dir函数

这个函数获取每线程ACP工作目录。

每个线程在{base_dir}/users/{user_id}/threads/{thread_id}/acp-workspace/下有隔离工作区。

并发会话不能互相读或覆盖对方的ACP代理输出。

thread_id不可用时回退到旧的全局acp-workspace目录。

目录不存在时自动创建。

### 3、_build_acp_mcp_servers函数

这个函数构建ACP的mcpServers负载。

DeerFlow的MCP helper返回name到config的映射。

ACP客户端期望服务器对象列表。

这个helper把启用的服务器转成ACP线上格式。

stdio传输需要command字段。

http和sse传输需要url字段。

不支持传输类型时报错。

### 4、_CollectingClient

这是内部类。

继承acp的Client。

它收集流式文本。

只收集agent_message_chunk类型的session_update里的TextContentBlock文本。

thought chunk保持内部。

不拼接进工具结果。

request_permission根据auto_approve配置构建权限响应。

auto_approve为True时选第一个allow_once或allow_always。

False时总是取消。

### 5、_invoke协程

这是主调用逻辑。

流程如下。

第一步验证代理名。

第二步在隔离工作目录里spawn代理进程。

第三步初始化ACP连接。

第四步创建会话。携带DeerFlow启用的MCP服务器。

第五步带超时发送prompt。超时后终止子进程并返回可操作错误。

第六步返回收集到的文本。空时返回"(no response)"。

失败时返回带补救建议的错误消息。

### 6、_format_invocation_error函数

这个函数返回带补救建议的用户可读错误。

命令找不到时给出安装建议。

codex-acp特殊处理。

已装的codex CLI不直接说ACP。需要装适配器。

mcode是MiniMax Code。直接说ACP。

给npm安装和登录指导。

### 7、build_invoke_acp_agent_tool函数

这个工厂构建工具。

代理列表捕获在闭包里。

## 三、它和谁协作

- acp包的spawn_agent_process、Client、PROTOCOL_VERSION。
- ExtensionsConfig提供启用的MCP服务器。
- paths的acp_workspace_dir解析工作目录。
- ACPAgentConfig提供每个代理的配置。

## 四、重要性评级

评级是6分。

理由如下。

这个工具是外部ACP代理的调用入口。

它处理了工作区隔离、MCP传递、权限响应、超时终止、可操作错误。

错误消息带具体补救建议。

thought chunk不混进结果。

但它依赖外部ACP生态。

使用面较窄。

扣掉4分。
