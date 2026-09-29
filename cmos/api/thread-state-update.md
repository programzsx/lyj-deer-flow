# 更新线程状态

## 接口地址

接口地址是`POST /api/threads/{thread_id}/state`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/state`。
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
请求体来自`ThreadStateUpdateRequest`模型。
- `values`：对象或null。要合并的通道值。默认null。
- `checkpoint_id`：字符串或null。作为分支起点的检查点。默认null。
- `checkpoint`：对象或null。完整检查点对象。默认null。
- `as_node`：字符串或null。更新使用的节点身份。默认null。缺省时是`manual_state_update`。

服务端拥有的状态元数据键会被剥离。未知字段返回422。更新`title`会同步到线程显示名。
请求示例JSON。
```json
{
  "values": {
    "title": "新标题"
  },
  "checkpoint_id": null,
  "as_node": null
}
```

## 响应出参
响应体来自`ThreadStateResponse`模型。响应示例来自源码响应模型推导。
- `values`：对象。更新后的通道值。
- `next`：字符串数组。下一个要执行的任务。
- `metadata`：对象。检查点元数据。
- `checkpoint`：对象。检查点信息。包含`id`和`ts`。
- `checkpoint_id`：字符串或null。当前检查点ID。
- `parent_checkpoint_id`：字符串或null。父检查点ID。
- `created_at`：字符串或null。检查点时间。
- `tasks`：数组。被中断任务的详情。

检查点不存在时返回404。线程有运行在执行时返回409。
响应示例。
```json
{
  "values": {
    "title": "新标题"
  },
  "next": [],
  "metadata": {},
  "checkpoint": {
    "id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
    "ts": "2026-09-29T08:00:05+00:00"
  },
  "checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
  "parent_checkpoint_id": null,
  "created_at": "2026-09-29T08:00:05+00:00",
  "tasks": []
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/state" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"values": {"title": "新标题"}}'
```
