# 获取插件静态资源

## 接口地址

请求方法是`GET`。

完整路径是`/api/plugins/{namespace}/assets/{revision}/{path:path}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/plugins/{namespace}/assets/{revision}/{path:path}`。

路径参数`namespace`是插件命名空间。

路径参数`revision`是资源包的修订标识。

路径参数`path`是资源文件路径。

`:path`表示该参数可以包含斜杠。

资源不可用时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

未认证调用返回401。

错误信息是`Authentication required.`。

## 请求入参

本接口有3个路径参数。

- `namespace`：插件命名空间。必填。字符串。必须与`LoadedBrowserAssets`插件的命名空间匹配。
- `revision`：资源包修订标识。必填。字符串。必须与插件的当前修订一致。
- `path`：资源文件路径。必填。字符串。路径必须是合法的资源路径。非法路径返回404。

本接口没有查询参数。

本接口没有请求体。

`namespace`和`revision`取值来自`GET /api/plugins`响应中的`entry`地址。

请求示例。

```
GET /api/plugins/bookmarks/assets/rev1/index.js HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应体是资源文件内容。

媒体类型取决于资源文件类型。

响应头包含以下字段。

- `Cache-Control`：值为`private, max-age=31536000, immutable`。
- `Vary`：值为`Cookie, Authorization`。
- `X-Content-Type-Options`：值为`nosniff`。
- `Content-Security-Policy`：值为`sandbox`。资源可以当作文档打开。SVG是典型例子。

资源不可用时响应头包含`Cache-Control: private, no-store`。

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/plugins/bookmarks/assets/rev1/index.js
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/plugins/bookmarks/assets/rev1/index.js
```
