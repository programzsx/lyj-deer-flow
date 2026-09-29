# SandboxAuditMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/sandbox_audit_middleware.py`

## 一、这个类是干什么的

SandboxAuditMiddleware对bash命令做安全审计。

对每一个bash工具调用它做两件事。

第一件是命令分级。用正则加shlex分析把命令分成三级。

高危命令被阻止。比如`rm -rf /`、`curl url | bash`。处理器不会被调用。返回错误ToolMessage。代理循环体面地继续。

中危命令正常执行。比如`pip install`、`chmod 777`。工具结果上追加一条警告。让LLM知道。

安全命令直接放行。

第二件是审计日志。每一条bash调用都记录成结构化JSON条目。通过标准日志器输出。在gateway.log里可见。

要说明的是这个分级是纵深防御加审计。不是安全边界。真正的隔离边界是沙箱本身。

## 二、类的成员

### （一）字段

- `state_schema`：固定为ThreadState。
- `_AUDIT_COMMAND_LIMIT`：审计命令长度上限200。
- `_MAX_COMMAND_LENGTH`：输入命令长度上限10000。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`：同步钩子。预处理分级。高危阻止。中危加警告。全部写审计。
- `awrap_tool_call`：异步版本的同一个钩子。

核心方法：

- `_pre_process`：预处理。返回命令、线程id、判定和拒绝原因。判定是block、warn、pass三种。
- `_validate_input`：校验输入命令。不可接受时返回拒绝原因。
- `_write_audit`：写审计日志条目。
- `_build_block_message`：构建阻止消息。
- `_append_warn_to_result`：给中危命令的工具结果追加警告。
- `_get_thread_id`：取线程id。

## 三、它和谁协作

- 它挂在中间件链的工具调用边界上。在SandboxMiddleware之内。
- 它只针对bash工具。
- 它的审计日志进gateway.log。
- 真正的隔离靠沙箱。这个中间件提供告警和审计。

## 四、重要性评级

评级：6/10。

理由：命令分级给了模型和操作员一层可见性。高危拦截能挡住明显的破坏性命令。审计日志让事后追责可行。但它是启发式。绕过手段很多。真正的安全边界是沙箱。所以给6分。