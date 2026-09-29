# 校验代理名称

## 接口地址

请求方法是`GET`。

完整路径是`/api/agents/check`。

网关端口是8001。

完整地址是`http://localhost:8001/api/agents/check`。

本接口没有路径参数。

代理名称放在查询参数中。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`agents:read`权限。

本接口要求`agents_api.enabled`配置为`true`。

功能未开放时返回403。

## 请求入参

本接口有1个查询参数。

- `name`：要校验的代理名称。必填。字符串。名称不匹配`^[A-Za-z0-9-]+$`时返回422。

本接口没有请求体。

请求示例。

```
GET /api/agents/check?name=research-agent HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码返回值推导。

- `available`：名称是否可用。布尔值。名称已被占用时为`false`。名称大小写不敏感。
- `name`：规范化后的名称。字符串。全部小写。

响应示例来自源码响应模型推导。

```json
{
  "available": true,
  "name": "research-agent"
}
```

名称已被占用时的响应示例。

```json
{
  "available": false,
  "name": "research-agent"
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:8001/api/agents/check?name=research-agent"
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" "http://localhost:8001/api/agents/check?name=research-agent"
```
