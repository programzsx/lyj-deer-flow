# 获取线程目标

## 接口地址

接口地址是`GET /api/threads/{thread_id}/goal`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/goal`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。

## 响应出参
响应体来自`ThreadGoalResponse`模型。响应示例来自源码响应模型推导。
- `goal`：对象或null。当前目标状态。没有活跃目标时是null。

`goal`对象包含以下字段。
- `objective`：字符串。目标内容。
- `status`：字符串。目标状态。活跃时是`active`。
- `created_at`：字符串。创建时间。
- `updated_at`：字符串。更新时间。
- `continuation_count`：整数。已发生的自动续跑次数。
- `max_continuations`：整数。最大自动续跑次数。
- `no_progress_count`：整数。无进展续跑计数。

响应示例。
```json
{
  "goal": {
    "objective": "持续完善报告直到覆盖所有章节",
    "status": "active",
    "created_at": "2026-09-29T08:00:00+00:00",
    "updated_at": "2026-09-29T08:00:00+00:00",
    "continuation_count": 0,
    "max_continuations": 8,
    "no_progress_count": 0
  }
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/goal" \
  -H "Authorization: Bearer <token>"
```
