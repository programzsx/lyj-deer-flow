# 创建线程分支

## 接口地址

接口地址是`POST /api/threads/{thread_id}/branches`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/branches`。
路径参数`thread_id`是源线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

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
请求体来自`ThreadBranchRequest`模型。
- `message_id`：字符串。必填。要从中分支的目标助手消息ID。最小长度1。
- `message_ids`：字符串数组。目标轮次中全部助手消息的ID。默认空数组。
- `title`：字符串或null。分支线程的可选标题。最大长度256。默认null。

请求示例JSON。
```json
{
  "message_id": "ai-msg-001",
  "message_ids": ["ai-msg-001"],
  "title": "换个方向继续"
}
```

## 响应出参
响应体来自`ThreadBranchResponse`模型。响应示例来自源码响应模型推导。
- `thread_id`：字符串。新分支线程的ID。服务端生成的UUID。
- `parent_thread_id`：字符串。源线程ID。
- `parent_checkpoint_id`：字符串。源检查点ID。
- `branched_from_message_id`：字符串。分支起点的助手消息ID。
- `workspace_clone_mode`：字符串。工作区克隆模式。从最新轮次分支时是`current_thread_best_effort`或`failed`。从历史轮次分支时是`skipped_historical_turn`。
- `history_seed_mode`：字符串。历史播种模式。取值是`seeded`、`skipped_empty`、`failed`。

分支只允许在主会话进行。源线程是分支时返回409。轮次不能再分支时返回409。线程有工作在运行中时返回409。
响应示例。
```json
{
  "thread_id": "5c9d8e7f-6a5b-4c3d-8e9f-0a1b2c3d4e5f",
  "parent_thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "parent_checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
  "branched_from_message_id": "ai-msg-001",
  "workspace_clone_mode": "current_thread_best_effort",
  "history_seed_mode": "seeded"
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/branches" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message_id": "ai-msg-001", "message_ids": ["ai-msg-001"], "title": "换个方向继续"}'
```
