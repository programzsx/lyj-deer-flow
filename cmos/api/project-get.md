# 项目详情查询接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/projects/{project_id}`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要查询的项目。

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

源码使用装饰器`@require_permission("projects", "read")`。

调用者需要`projects:read`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`projects:read`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

项目不存在或不属于调用者时返回404。

源码故意不区分这两种情况。这样不会泄露其他用户的项目是否存在。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要查询的项目。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `id`：项目ID。字符串类型。
- `name`：项目名称。字符串类型。
- `instructions`：项目指令。字符串类型。项目缺失该字段时返回空字符串。
- `presentation`：展示配置。字典类型。项目缺失该字段时返回空字典。
- `status`：项目状态。字符串类型。取值是`active`或`archived`。
- `created_at`：创建时间。字符串类型。ISO格式。
- `updated_at`：更新时间。字符串类型。ISO格式。

响应示例来自源码响应模型推导。

```json
{
  "id": "p_123",
  "name": "市场分析",
  "instructions": "关注中国市场",
  "presentation": {},
  "status": "active",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

## curl命令

```bash
curl -s http://localhost:8001/api/projects/p_123 \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s http://localhost:8001/api/projects/p_123 \
  -H "Cookie: access_token=<token>"
```
