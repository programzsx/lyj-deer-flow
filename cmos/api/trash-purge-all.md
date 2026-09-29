# 回收站清空接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/trash/purge`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/trash/purge`。

本接口没有路径参数。

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

本接口不需要admin权限。

## 请求入参

本接口没有路径参数。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

本接口的行为说明如下。

本接口彻底删除调用者的全部回收站文档。

本接口与文档年龄无关。保留天数过期不是本接口的职责。保留过期由保留清扫任务负责。

删除顺序是先删除字节。然后删除行。

文件清理失败时返回HTTP 500。错误信息提示可以重试。失败的那一行和尚未访问的行都保持在回收站中。

响应字段说明如下。

- `purged`：被彻底删除的文档数量。整数类型。

响应示例来自源码响应模型推导。

```json
{
  "purged": 3
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/trash/purge \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s -X POST http://localhost:8001/api/trash/purge \
  -H "Cookie: access_token=<token>"
```
