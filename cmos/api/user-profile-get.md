# 获取用户画像

## 接口地址

请求方法是`GET`。

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

本接口需要`agents:read`权限。

本接口要求`agents_api.enabled`配置为`true`。

功能未开放时返回403。

文件按调用者的用户目录隔离。

路径是`{base_dir}/users/{user_id}/USER.md`。

一个用户无法读取另一个用户的画像。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/user-profile HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`UserProfileResponse`模型推导。

- `content`：USER.md文件内容。可为`null`。文件尚未创建时为`null`。

USER.md内容描述用户的背景和偏好。

USER.md尚未创建时content为`null`。

响应示例来自源码响应模型推导。

```json
{
  "content": "# 用户画像\n\n- 背景：后端工程师，主用Python。\n- 偏好：简短直接的回答。"
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/user-profile
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/user-profile
```
