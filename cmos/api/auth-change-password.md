# 修改密码

## 接口地址

接口地址是`POST /api/v1/auth/change-password`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/change-password`。

## 接口鉴权
这个接口需要登录。
认证方式只支持session cookie的`access_token`。
PAT认证的调用者返回403。密码修改必须使用交互式会话认证。
认证禁用模式（`DEER_FLOW_AUTH_DISABLED=1`）返回400。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。

## 请求入参
请求体来自`ChangePasswordRequest`模型。
- `current_password`：字符串。必填。当前密码。
- `new_password`：字符串。必填。新密码。最小长度8。常见弱密码会被拒绝。
- `new_email`：字符串或null。可选。同时更新邮箱。默认null。
- `remember_me`：布尔值或null。可选。是否持久化会话cookie。默认null。

请求示例JSON。
```json
{
  "current_password": "old-password",
  "new_password": "a-new-strong-password",
  "new_email": null,
  "remember_me": null
}
```

## 响应出参
响应体来自`MessageResponse`模型。响应示例来自源码响应模型推导。
这个接口总是递增`token_version`。旧会话会全部失效。服务端会用新`token_version`重新签发cookie。
提供`new_email`时会检查邮箱唯一性。首次设置流程中提供`new_email`会清除`needs_setup`。
- `message`：字符串。结果说明。

OAuth用户返回400。当前密码错误返回400。新邮箱已被占用返回400。
响应示例。
```json
{
  "message": "Password changed successfully"
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/v1/auth/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"current_password": "old-password", "new_password": "a-new-strong-password"}'
```
