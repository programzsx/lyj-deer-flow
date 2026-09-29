# 获取插件前端模块

## 接口地址

请求方法是`GET`。

完整路径是`/api/plugins/modules/{module}/{revision}.mjs`。

网关端口是8001。

完整地址是`http://localhost:8001/api/plugins/modules/{module}/{revision}.mjs`。

路径参数`module`是插件前端模块名。

路径参数`revision`是模块代码的SHA-256摘要。

摘要不匹配时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

未认证调用返回401。

错误信息是`Authentication required.`。

## 请求入参

本接口有2个路径参数。

- `module`：插件前端模块名。必填。字符串。
- `revision`：模块代码的SHA-256摘要。必填。字符串。摘要必须与当前代码一致。

本接口没有查询参数。

本接口没有请求体。

`revision`取值来自`GET /api/plugins`响应中的`entry`地址。

模块不可用时返回404。

错误信息是`Plugin module unavailable; reload the page.`。

请求示例。

```
GET /api/plugins/modules/bookmarks/abc123.mjs HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应体是JavaScript模块代码。

媒体类型是`text/javascript`。

响应头包含以下字段。

- `Cache-Control`：值为`private, no-store`。
- `X-Content-Type-Options`：值为`nosniff`。

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/plugins/modules/bookmarks/abc123.mjs
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/plugins/modules/bookmarks/abc123.mjs
```
