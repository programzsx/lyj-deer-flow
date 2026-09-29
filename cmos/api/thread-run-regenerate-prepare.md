# 准备重新生成最新回答

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs/regenerate/prepare`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/regenerate/prepare`。
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

## 请求入参
请求体来自`RegeneratePrepareRequest`模型。
- `message_id`：字符串。必填。要重新生成的助手消息ID。最小长度1。

请求示例JSON。
```json
{
  "message_id": "ai-msg-001"
}
```

## 响应出参
响应体来自`RegeneratePrepareResponse`模型。响应示例来自源码响应模型推导。
- `input`：对象。重新生成用的图输入。包含`messages`。标题非空时还包含`title`。
- `checkpoint`：对象。回放基础检查点。包含`checkpoint_ns`、`checkpoint_id`、`checkpoint_map`。
- `metadata`：对象。回放元数据。包含`regenerate_from_message_id`、`regenerate_from_run_id`、`regenerate_checkpoint_id`。
- `target_run_id`：字符串。源运行ID。

只允许重新生成最新一条可见助手消息。找不到消息返回404。找不到源运行或基础检查点返回409。
响应示例。
```json
{
  "input": {
    "messages": [
      {
        "type": "human",
        "content": [{"type": "text", "text": "帮我总结这份文档"}],
        "id": "human-msg-001"
      }
    ],
    "title": "文档总结"
  },
  "checkpoint": {
    "checkpoint_ns": "",
    "checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
    "checkpoint_map": null
  },
  "metadata": {
    "regenerate_from_message_id": "ai-msg-001",
    "regenerate_from_run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "regenerate_checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f"
  },
  "target_run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/regenerate/prepare" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message_id": "ai-msg-001"}'
```
