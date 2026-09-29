# 手动压缩线程上下文

## 接口地址

接口地址是`POST /api/threads/{thread_id}/compact`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/compact`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:write`。
这个接口要求调用者是线程的所有者。线程必须已存在。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
请求体来自`ThreadCompactRequest`模型。
- `force`：布尔值。是否在未达到自动摘要阈值时也执行压缩。默认true。
- `keep`：对象或null。本次压缩专用的保留策略。默认null。对象包含`type`和`value`。`type`取值是`fraction`、`tokens`、`messages`。
- `agent_name`：字符串或null。可选的遗留代理提示。最大长度128。默认null。
- `model_name`：字符串或null。用于摘要的模型。默认null。

请求示例JSON。
```json
{
  "force": true,
  "keep": null,
  "agent_name": null,
  "model_name": null
}
```

## 响应出参
响应体来自`ThreadCompactResponse`模型。响应示例来自源码响应模型推导。
- `thread_id`：字符串。线程ID。
- `compacted`：布尔值。是否发生了压缩。
- `reason`：字符串或null。未压缩时的原因。
- `removed_message_count`：整数。被摘要移除的消息数。
- `preserved_message_count`：整数。保留的近期消息数。
- `summary_updated`：布尔值。摘要是否被更新。
- `checkpoint_id`：字符串或null。新检查点ID。
- `total_tokens`：整数。压缩后线程总token数。

线程有运行在执行时返回409。上下文压缩被禁用时返回409。线程不存在时返回404。
响应示例。
```json
{
  "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "compacted": true,
  "reason": null,
  "removed_message_count": 10,
  "preserved_message_count": 20,
  "summary_updated": true,
  "checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
  "total_tokens": 3200
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/compact" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```
