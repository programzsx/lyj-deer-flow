# 删除托管子代理

## 接口地址

请求方法是`DELETE`。

完整路径是`/api/subagents/{name}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/subagents/{name}`。

路径参数`name`是要删除的托管子代理名称。

托管子代理不存在时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口是管理员专属接口。

非管理员调用返回403。

错误信息是`Admin privileges are required to manage subagents.`。

## 请求入参

本接口有1个路径参数。

- `name`：要删除的托管子代理名称。必填。字符串。名称不合法时返回422。

本接口没有请求体。

请求示例。

```
DELETE /api/subagents/research-agent HTTP/1.1
Host: localhost:8001
```

## 响应出参

本接口成功时返回204状态码。

本接口没有响应体。

托管子代理不存在时返回404。

错误信息是`Managed subagent '<名称>' not found`。

## curl命令

```bash
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:8001/api/subagents/research-agent
```

也可以使用会话Cookie。

```bash
curl -X DELETE -b "access_token=<token>" http://localhost:8001/api/subagents/research-agent
```
