# 项目删除接口

## 接口地址

请求方法是`DELETE`。

完整路径是`/api/projects/{project_id}`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要删除的项目。

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

源码使用装饰器`@require_permission("projects", "delete")`。

调用者需要`projects:delete`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`projects:delete`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

项目不存在或不属于调用者时返回404。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示要删除的项目。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 204。

响应没有响应体。

## curl命令

```bash
curl -s -X DELETE http://localhost:8001/api/projects/p_123 \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s -X DELETE http://localhost:8001/api/projects/p_123 \
  -H "Cookie: access_token=<token>"
```
