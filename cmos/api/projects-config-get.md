# 项目配置查询接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/projects/config`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/config`。

本接口没有路径参数。

该路径是固定的配置路由。`config`不是项目ID。

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

本接口不需要admin权限。

## 请求入参

本接口没有路径参数。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `instructions_max_bytes`：项目指令的字节上限。整数类型。上限按UTF-8字节数计算。前端用该值在客户端做校验。
- `trash_retention_days`：回收站保留天数。整数类型。回收站文档超过该天数会被保留清扫任务删除。

响应的值来自运行中的`projects`配置块。配置块缺失时，返回`ProjectsConfig`的默认值。

响应示例来自源码响应模型推导。

```json
{
  "instructions_max_bytes": 65536,
  "trash_retention_days": 30
}
```

## curl命令

```bash
curl -s http://localhost:8001/api/projects/config \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s http://localhost:8001/api/projects/config \
  -H "Cookie: access_token=<token>"
```
