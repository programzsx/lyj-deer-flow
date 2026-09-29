# 移动线程所属项目

## 接口地址

接口地址是`POST /api/threads/{thread_id}/move`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/move`。
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
请求体来自`ThreadMoveRequest`模型。
- `project_id`：字符串或null。必填。目标项目ID。null表示移出项目。

这个接口只改组织归属。历史、运行状态和线程文件不受影响。

请求示例JSON。
```json
{
  "project_id": "proj-001"
}
```

## 响应出参
响应体来自`ThreadResponse`模型。响应示例来自源码响应模型推导。
- `thread_id`：字符串。线程ID。
- `status`：字符串。线程状态。取值是`idle`、`busy`、`interrupted`、`error`。
- `created_at`：字符串。创建时间。
- `updated_at`：字符串。更新时间。
- `metadata`：对象。线程元数据。包含项目归属键。
- `values`：对象。当前状态通道值。本接口不返回。默认空对象。
- `interrupts`：对象。待处理中断。本接口不返回。默认空对象。

线程或项目不存在时返回404。
响应示例。
```json
{
  "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "idle",
  "created_at": "2026-09-29T08:00:00+00:00",
  "updated_at": "2026-09-29T08:00:05+00:00",
  "metadata": {
    "deerflow_project_id": "proj-001"
  },
  "values": {},
  "interrupts": {}
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/move" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "proj-001"}'
```
