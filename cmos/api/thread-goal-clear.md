# 清除线程目标

## 接口地址

接口地址是`DELETE /api/threads/{thread_id}/goal`。
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
用session cookie发起DELETE请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。

## 响应出参
响应体来自`ThreadGoalResponse`模型。响应示例来自源码响应模型推导。
- `goal`：对象或null。清除后总是null。

线程有运行在执行时返回409。
响应示例。
```json
{
  "goal": null
}
```

## curl命令
```bash
curl -X DELETE "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/goal" \
  -H "Authorization: Bearer <token>"
```
