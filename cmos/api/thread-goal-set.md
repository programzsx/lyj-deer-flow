# 设置线程目标

## 接口地址

接口地址是`PUT /api/threads/{thread_id}/goal`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/goal`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:write`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起PUT请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
请求体来自`ThreadGoalRequest`模型。
- `objective`：字符串。必填。代理持续追求的完成条件。最小长度1。最大长度4000。
- `max_continuations`：整数。最大自动隐藏续跑轮数。取值范围是0到8。默认8。

这个接口会按需创建缺失的线程检查点。线程有运行在执行时返回409。
请求示例JSON。
```json
{
  "objective": "持续完善报告直到覆盖所有章节",
  "max_continuations": 8
}
```

## 响应出参
响应体来自`ThreadGoalResponse`模型。响应示例来自源码响应模型推导。
- `goal`：对象或null。设置后的目标状态。

`goal`对象包含以下字段。
- `objective`：字符串。目标内容。
- `status`：字符串。目标状态。新目标是`active`。
- `created_at`：字符串。创建时间。
- `updated_at`：字符串。更新时间。
- `continuation_count`：整数。初始为0。
- `max_continuations`：整数。最大自动续跑次数。
- `no_progress_count`：整数。初始为0。

参数校验失败返回422。
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
curl -X PUT "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/goal" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"objective": "持续完善报告直到覆盖所有章节", "max_continuations": 8}'
```
