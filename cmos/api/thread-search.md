# 搜索线程

## 接口地址

接口地址是`POST /api/threads/search`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/search`。
这个接口没有路径参数。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:read`。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
请求体来自`ThreadSearchRequest`模型。
- `archived`：布尔值或null。归档过滤。省略时包含全部。false时包含未归档线程。默认null。
- `metadata`：对象。元数据过滤。精确匹配。默认空对象。
- `project_id`：字符串或null。项目过滤。显式null表示未分配线程。省略键表示全部。默认省略。
- `limit`：整数。最大结果数。取值范围是1到1000。默认100。
- `offset`：整数。分页偏移。最小值0。默认0。
- `status`：字符串或null。按线程状态过滤。默认null。

不安全的元数据过滤键或不支持的值类型会返回400。
请求示例JSON。
```json
{
  "archived": false,
  "metadata": {},
  "limit": 100,
  "offset": 0
}
```

## 响应出参
响应体是一个数组。每个元素来自`ThreadResponse`模型。响应示例来自源码响应模型推导。
- `thread_id`：字符串。线程ID。
- `status`：字符串。线程状态。取值是`idle`、`busy`、`interrupted`、`error`。
- `created_at`：字符串。创建时间。
- `updated_at`：字符串。更新时间。
- `metadata`：对象。线程元数据。敏感项会被脱敏。
- `values`：对象。有显示名时是`{"title": "显示名"}`。否则是空对象。
- `interrupts`：对象。总是空对象。

响应示例。
```json
[
  {
    "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "idle",
    "created_at": "2026-09-29T08:00:00+00:00",
    "updated_at": "2026-09-29T08:00:05+00:00",
    "metadata": {},
    "values": {"title": "文档总结"},
    "interrupts": {}
  }
]
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/search" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"archived": false, "limit": 100, "offset": 0}'
```
