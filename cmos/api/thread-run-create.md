# 创建后台运行

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:create`。
这个接口要求调用者是线程的所有者。线程必须已存在。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。
本接口支持可选的`Idempotency-Key`请求头。这个头的最大长度是255。这个头用于重试时的幂等提交。

## 请求入参
请求体是JSON。字段来自`RunCreateRequest`模型。未声明的字段会被拒绝。
- `assistant_id`：字符串或null。要使用的助手ID。默认null。
- `input`：对象或null。图的输入。例如`{"messages": [...]}`。默认null。
- `command`：对象或null。LangGraph命令。默认null。
- `metadata`：对象或null。运行元数据。默认null。
- `config`：对象或null。RunnableConfig覆盖项。默认null。
- `context`：对象或null。DeerFlow上下文覆盖项。例如`model_name`、`thinking_enabled`。默认null。
- `conversation_references`：字符串数组。显式授权本次运行可读的线程ID。最多3个。每个元素长度1到2048。默认空数组。
- `webhook`：只接受null。完成回调不被支持。
- `checkpoint_id`：字符串或null。从指定检查点恢复。默认null。
- `checkpoint`：对象或null。完整检查点对象。默认null。
- `interrupt_before`：字符串数组、`*`或null。在这些节点前中断。默认null。
- `interrupt_after`：字符串数组、`*`或null。在这些节点后中断。默认null。
- `stream_mode`：字符串、字符串数组或null。支持的流模式。默认null。
- `stream_subgraphs`：布尔值。是否包含子图事件。默认false。
- `stream_resumable`：只接受false或null。可恢复流不被支持。
- `on_disconnect`：枚举`cancel`或`continue`。SSE断开时的行为。默认`cancel`。
- `on_completion`：只接受null。完成回调行为不被支持。
- `multitask_strategy`：枚举`reject`、`rollback`、`interrupt`。并发策略。默认`reject`。
- `after_seconds`：只接受null。延迟执行不被支持。
- `if_not_exists`：只接受`create`。线程缺失时的兼容默认值。
- `feedback_keys`：只接受null。反馈键收集不被支持。

请求示例JSON。
```json
{
  "assistant_id": null,
  "input": {
    "messages": [
      {"type": "human", "content": "帮我总结这份文档"}
    ]
  },
  "multitask_strategy": "reject",
  "stream_subgraphs": false,
  "on_disconnect": "cancel"
}
```

## 响应出参
这个接口创建后台运行并立即返回。
响应体来自`RunResponse`模型。响应示例来自源码响应模型推导。
- `run_id`：字符串。运行ID。
- `thread_id`：字符串。线程ID。
- `assistant_id`：字符串或null。助手ID。
- `status`：字符串。运行状态。取值是`pending`、`running`、`success`、`error`、`timeout`、`interrupted`。刚创建时是`pending`。
- `metadata`：对象。运行元数据。服务端会脱敏其中的敏感配置。
- `kwargs`：对象。运行参数。其中`config`的敏感项会被脱敏。
- `multitask_strategy`：字符串。并发策略。
- `created_at`：字符串。创建时间。
- `updated_at`：字符串。更新时间。
- `total_input_tokens`：整数。输入token总数。
- `total_output_tokens`：整数。输出token总数。
- `total_tokens`：整数。token总数。
- `llm_call_count`：整数。LLM调用次数。
- `lead_agent_tokens`：整数。主代理消耗的token。
- `subagent_tokens`：整数。子代理消耗的token。
- `middleware_tokens`：整数。中间件消耗的token。
- `message_count`：整数。消息数量。
- `stop_reason`：字符串或null。停止原因。

响应示例。
```json
{
  "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "assistant_id": null,
  "status": "pending",
  "metadata": {},
  "kwargs": {},
  "multitask_strategy": "reject",
  "created_at": "2026-09-29T08:00:00+00:00",
  "updated_at": "2026-09-29T08:00:00+00:00",
  "total_input_tokens": 0,
  "total_output_tokens": 0,
  "total_tokens": 0,
  "llm_call_count": 0,
  "lead_agent_tokens": 0,
  "subagent_tokens": 0,
  "middleware_tokens": 0,
  "message_count": 0,
  "stop_reason": null
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"messages": [{"type": "human", "content": "帮我总结这份文档"}]}}'
```
