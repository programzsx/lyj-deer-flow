# 创建运行并流式输出

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs/stream`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/stream`。
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
请求体与`POST /api/threads/{thread_id}/runs`完全一致。字段来自`RunCreateRequest`模型。未声明的字段会被拒绝。
- `assistant_id`：字符串或null。要使用的助手ID。默认null。
- `input`：对象或null。图的输入。例如`{"messages": [...]}`。默认null。
- `command`：对象或null。LangGraph命令。默认null。
- `metadata`：对象或null。运行元数据。默认null。
- `config`：对象或null。RunnableConfig覆盖项。默认null。
- `context`：对象或null。DeerFlow上下文覆盖项。默认null。
- `conversation_references`：字符串数组。显式授权本次运行可读的线程ID。最多3个。默认空数组。
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
  "input": {
    "messages": [
      {"type": "human", "content": "帮我总结这份文档"}
    ]
  },
  "stream_mode": ["messages"],
  "on_disconnect": "cancel"
}
```

## 响应出参
这个接口创建运行并通过SSE流式返回事件。
响应的媒体类型是`text/event-stream`。
响应示例来自源码响应模型推导。
响应头包含以下字段。
- `Content-Location`：本次运行的资源URL。格式是`/api/threads/{thread_id}/runs/{run_id}`。LangGraph SDK从这个头提取运行ID。
- `Cache-Control`：值是`no-cache`。
- `Connection`：值是`keep-alive`。
- `X-Accel-Buffering`：值是`no`。

响应体是SSE事件流。事件格式与LangGraph Platform协议对齐。
SSE事件示例。
```
event: messages
data: {"type":"ai","content":"好的，我来总结这份文档。"}

event: end
data: {}
```
复用一个仍在其他worker上活跃的运行时，本接口返回409。重用已完成且流已丢失的运行时，事件流会发出`gap`事件。

## curl命令
```bash
curl -N -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/stream" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"messages": [{"type": "human", "content": "帮我总结这份文档"}]}}'
```
