# 创建运行并等待完成

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs/wait`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/wait`。
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
      {"type": "human", "content": "1加1等于几"}
    ]
  }
}
```

## 响应出参
这个接口创建运行并阻塞到运行完成。
响应体是一个对象。响应示例来自源码响应模型推导。
运行正常完成时返回最新检查点的状态值。返回内容是图通道值的序列化结果。典型键是`messages`、`title`等。
运行被重用或完成状态无法观测时返回持久化状态。返回字段如下。
- `status`：字符串。运行状态。取值是`pending`、`running`、`success`、`error`、`timeout`、`interrupted`。
- `error`：字符串或null。错误信息。

响应示例一。运行完成且能读取最终状态。
```json
{
  "messages": [
    {"type": "human", "content": "1加1等于几"},
    {"type": "ai", "content": "1加1等于2。"}
  ],
  "title": "加法问题"
}
```
响应示例二。返回持久化状态。
```json
{
  "status": "success",
  "error": null
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/wait" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"messages": [{"type": "human", "content": "1加1等于几"}]}}'
```
