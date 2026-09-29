# 取消运行

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs/{run_id}/cancel`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/{run_id}/cancel`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。
路径参数`run_id`是运行ID。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:cancel`。
这个接口要求调用者是线程的所有者。线程必须已存在。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
这个接口没有请求体。参数通过查询字符串传递。
- `wait`：布尔值。是否阻塞到运行完全停止。默认false。
- `action`：枚举`interrupt`或`rollback`。取消动作。默认`interrupt`。

`action=interrupt`表示停止执行并保留当前检查点。运行可以恢复。
`action=rollback`表示停止执行并回滚到运行前的检查点状态。
`wait=true`时阻塞到运行完全停止并返回204。
`wait=false`时立即返回202。

## 响应出参
这个接口成功时返回空响应体。
响应示例来自源码响应模型推导。
- `wait=false`时返回202。响应体为空。
- `wait=true`且能等待到完成时返回204。响应体为空。
- 取消请求落在非所有者worker上且租约有效时返回409。响应体带`detail`。
- 运行不可取消时返回409。响应体带`detail`。

409响应示例。
```json
{
  "detail": "Run 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d is not cancellable (status: success)"
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/cancel?wait=false&action=interrupt" \
  -H "Authorization: Bearer <token>"
```
