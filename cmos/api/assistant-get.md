# 助手详情查询接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/assistants/{assistant_id}`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/assistants/lead_agent`。

路径参数说明如下。

- `assistant_id`：助手ID。字符串类型。表示要查询的助手。默认助手是`lead_agent`。自定义代理用代理名称。

## 接口鉴权

认证方式说明如下。

本接口是LangGraph平台兼容接口。源码没有使用`@require_permission`装饰器。

但是网关的认证中间件是严格认证网关。

网关只对公共路径放行。公共路径包括健康检查、文档页面和认证接口。

本接口不在公共路径内。所以本接口需要认证。

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

本接口不需要特定权限。

但是PAT有路由白名单限制。该路由不在PAT白名单内。

所以PAT调用者访问该路由会返回403。

该路由只支持session cookie认证。

本接口不需要admin权限。

## 请求入参

路径参数说明如下。

- `assistant_id`：助手ID。字符串类型。表示要查询的助手。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

助手不存在时返回HTTP 404。

响应字段说明如下。

- `assistant_id`：助手ID。字符串类型。
- `graph_id`：图ID。字符串类型。所有助手都使用`lead_agent`图。
- `name`：助手名称。字符串类型。
- `config`：助手配置。字典类型。默认值是空字典。
- `metadata`：元数据。字典类型。默认助手是`{"created_by": "system"}`。自定义代理是`{"created_by": "user"}`。
- `description`：助手描述。字符串类型或`null`。
- `created_at`：创建时间。字符串类型。ISO格式。
- `updated_at`：更新时间。字符串类型。ISO格式。
- `version`：版本。整数类型。默认值是1。

响应示例来自源码响应模型推导。

```json
{
  "assistant_id": "lead_agent",
  "graph_id": "lead_agent",
  "name": "lead_agent",
  "config": {},
  "metadata": {"created_by": "system"},
  "description": "DeerFlow lead agent",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z",
  "version": 1
}
```

## curl命令

```bash
curl -s http://localhost:8001/api/assistants/lead_agent \
  -H "Cookie: access_token=<token>"
```
