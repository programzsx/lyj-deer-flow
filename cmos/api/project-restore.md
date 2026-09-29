# 项目恢复接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/projects/{project_id}/restore`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123/restore`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要恢复的项目。

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

源码使用装饰器`@require_permission("projects", "write")`。

调用者需要`projects:write`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`projects:write`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

项目不存在或不属于调用者时返回404。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要恢复的项目。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `id`：项目ID。字符串类型。
- `name`：项目名称。字符串类型。
- `instructions`：项目指令。字符串类型。
- `presentation`：展示配置。字典类型。
- `status`：项目状态。字符串类型。恢复后的状态是`active`。
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
  "updated_at": "2026-01-02T00:00:00Z"
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/projects/p_123/restore \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s -X POST http://localhost:8001/api/projects/p_123/restore \
  -H "Cookie: access_token=<token>"
```
