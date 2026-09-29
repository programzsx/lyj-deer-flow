# 项目文档删除接口

## 接口地址

请求方法是`DELETE`。

完整路径是`/api/projects/{project_id}/documents/{document_id}`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123/documents/doc_001`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示文档所属的项目。
- `document_id`：文档ID。字符串类型。表示要删除的项目文档。

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

项目不存在或不属于调用者时返回404。

文档不存在或不属于该项目时也返回404。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示文档所属的项目。
- `document_id`：文档ID。字符串类型。表示要删除的项目文档。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 204。

响应没有响应体。

本接口的行为说明如下。

本接口把文档移动到回收站。移动到回收站不会立即删除文件。

删除后的文档进入回收站。回收站文档可以恢复或彻底删除。

恢复和彻底删除属于回收站层级的接口。

已归档项目在仓库的锁定事务内拒绝该写入。已归档项目同样返回404。

## curl命令

```bash
curl -s -X DELETE http://localhost:8001/api/projects/p_123/documents/doc_001 \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s -X DELETE http://localhost:8001/api/projects/p_123/documents/doc_001 \
  -H "Cookie: access_token=<token>"
```
