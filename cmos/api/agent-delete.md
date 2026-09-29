# 删除自定义代理

## 接口地址

请求方法是`DELETE`。

完整路径是`/api/agents/{name}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/agents/{name}`。

路径参数`name`是要删除的自定义代理名称。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`agents:write`权限。

本接口要求`agents_api.enabled`配置为`true`。

功能未开放时返回403。

代理只从调用者自己的用户目录删除。

## 请求入参

本接口有1个路径参数。

- `name`：要删除的代理名称。必填。字符串。名称不合法时返回422。

本接口没有请求体。

本接口删除代理的全部文件。

删除范围包括config、SOUL.md和memory。

删除前和删除后会取消该代理缓冲的记忆提取任务。

代理不存在每用户副本时返回404。

代理只存在于旧共享布局时返回409。

错误信息提示先运行`scripts/migrate_user_isolation.py`迁移。

目录含memory数据但缺少config.yaml时返回409。

原因是该目录不是自定义代理。

目录会被保留。

请求示例。

```
DELETE /api/agents/research-agent HTTP/1.1
Host: localhost:8001
```

## 响应出参

本接口成功时返回204状态码。

本接口没有响应体。

删除失败时返回500。

## curl命令

```bash
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:8001/api/agents/research-agent
```

也可以使用会话Cookie。

```bash
curl -X DELETE -b "access_token=<token>" http://localhost:8001/api/agents/research-agent
```
