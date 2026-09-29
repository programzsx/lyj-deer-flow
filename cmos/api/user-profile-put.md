# 更新用户画像

## 接口地址

请求方法是`PUT`。

完整路径是`/api/user-profile`。

网关端口是8001。

完整地址是`http://localhost:8001/api/user-profile`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`agents:write`权限。

本接口要求`agents_api.enabled`配置为`true`。

功能未开放时返回403。

写入目标是调用者自己的用户目录。

路径是`{base_dir}/users/{user_id}/USER.md`。

一个用户无法写入另一个用户的画像。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`UserProfileUpdateRequest`模型。

- `content`：USER.md内容。必填。字符串。默认空字符串。内容描述用户的背景和偏好。

本接口创建或覆盖当前用户的USER.md。

文件不存在时本接口创建该文件。

文件存在时本接口覆盖该文件。

请求示例。

```json
{
  "content": "# 用户画像\n\n- 背景：后端工程师，主用Python。\n- 偏好：简短直接的回答。"
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`UserProfileResponse`模型推导。

- `content`：保存后的USER.md内容。可为`null`。保存空内容时为`null`。

响应示例来自源码响应模型推导。

```json
{
  "content": "# 用户画像\n\n- 背景：后端工程师，主用Python。\n- 偏好：简短直接的回答。"
}
```

## curl命令

```bash
curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"content":"# 用户画像\n\n- 背景：后端工程师，主用Python。"}' http://localhost:8001/api/user-profile
```

也可以使用会话Cookie。

```bash
curl -X PUT -b "access_token=<token>" -H "Content-Type: application/json" -d '{"content":"# 用户画像\n\n- 背景：后端工程师，主用Python。"}' http://localhost:8001/api/user-profile
```
