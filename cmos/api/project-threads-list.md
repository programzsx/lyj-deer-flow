# 项目会话列表接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/projects/{project_id}/threads`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123/threads`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要查询会话列表的项目。

## 接口鉴权

认证方式有两种。

第一种是session cookie认证。

浏览器先登录。登录接口是`POST /api/v1/auth/login/local`。

登录成功后，网关下发HttpOnly的`access_token`cookie。

后续请求携带该cookie。

第二种是PAT认证。

PAT是个人访问令牌。令牌以`dfp_`开头。

请求时放在`Authorization`头部。格式是`Bearer <token>`。

token来源说明如下。

session cookie的token来自登录接口。

PAT的token来自用户在令牌管理接口创建的令牌。

权限说明如下。

源码使用两个装饰器。

装饰器是`@require_permission("projects", "read")`和`@require_permission("threads", "read")`。

调用者需要`projects:read`权限。

调用者同时需要`threads:read`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域同时包含两个权限。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

项目不存在或不属于调用者时返回404。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要查询会话列表的项目。

查询参数说明如下。

- `limit`：单页数量。整数类型。可选。默认值是100。最小值是1。最大值是1000。
- `offset`：偏移量。整数类型。可选。默认值是0。最小值是0。

本接口没有请求体。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应是数组。数组每个元素是一条会话记录。

响应字段说明如下。

- `thread_id`：会话ID。字符串类型。
- `display_name`：会话显示名称。字符串类型或`null`。会话尚未命名时为`null`。
- `created_at`：会话创建时间。字符串类型。ISO格式。
- `updated_at`：会话更新时间。字符串类型。ISO格式。
- `metadata`：会话元数据。字典类型。其中包含的敏感键会被脱敏处理。元数据中的`deerflow_project_id`键是该字段的服务端只读暴露。

响应只返回未归档的会话。已归档的会话不出现在该列表中。

响应示例来自源码响应模型推导。

```json
[
  {
    "thread_id": "th_abc",
    "display_name": "第一季度分析",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-02T00:00:00Z",
    "metadata": {}
  }
]
```

## curl命令

```bash
curl -s "http://localhost:8001/api/projects/p_123/threads?limit=100&offset=0" \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s "http://localhost:8001/api/projects/p_123/threads?limit=100&offset=0" \
  -H "Cookie: access_token=<token>"
```
