# 列出插件

## 接口地址

请求方法是`GET`。

完整路径是`/api/plugins`。

网关端口是8001。

完整地址是`http://localhost:8001/api/plugins`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

未认证调用返回401。

错误信息是`Authentication required.`。

本接口只列出部署级安装的全栈插件。

本接口不需要管理员权限。

响应头包含`Cache-Control: private, no-store`。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/plugins HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON数组。

数组中每个元素是一个已安装插件的条目。

响应字段来自源码返回值推导。

- `namespace`：插件命名空间。字符串。
- `title`：插件标题。字符串。
- `description`：插件描述。字符串。
- `viewer_id`：当前查看者的用户ID。字符串。
- `module`：前端模块名。可为`null`。
- `entry`：前端模块入口地址。可为`null`。
- `transport`：前端模块传输方式。取值是`assets-v1`、`inline-v1`之一。无前端模块时为`null`。
- `settings`：插件设置。只包含公开字段。始终包含`enabled`。
- `backend_actions`：后端动作名列表。字符串数组。

`transport`为`assets-v1`时`entry`指向`/api/plugins/{namespace}/assets/{revision}/{entry}`。

`transport`为`inline-v1`时`entry`指向`/api/plugins/modules/{module}/{revision}.mjs`。

响应示例来自源码响应模型推导。

```json
[
  {
    "namespace": "bookmarks",
    "title": "Bookmarks",
    "description": "Bookmark management plugin",
    "viewer_id": "user-123",
    "module": "bookmarks",
    "entry": "/api/plugins/modules/bookmarks/abc123.mjs",
    "transport": "inline-v1",
    "settings": {"enabled": true},
    "backend_actions": ["list_bookmarks"]
  }
]
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/plugins
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/plugins
```
