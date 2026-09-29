# 项目文档附加到会话接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/projects/{project_id}/documents/{document_id}/attach-to-thread/{thread_id}`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123/documents/doc_001/attach-to-thread/th_abc`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示文档所属的项目。
- `document_id`：文档ID。字符串类型。表示要附加的项目文档。
- `thread_id`：目标会话ID。字符串类型。表示文档要附加到的会话。

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

装饰器是`@require_permission("projects", "write")`和`@require_permission("threads", "write", owner_check=True, require_existing=True)`。

调用者需要`projects:write`权限。

调用者同时需要`threads:write`权限。

`owner_check=True`表示网关会校验调用者是否拥有目标会话。

`require_existing=True`表示会话必须真实存在。不存在的会话返回404。

调用者不能写目标会话时返回404。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域同时包含两个权限。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示文档所属的项目。
- `document_id`：文档ID。字符串类型。表示要附加的项目文档。
- `thread_id`：目标会话ID。字符串类型。表示文档要附加到的会话。

本接口没有请求体。

本接口没有查询参数。

本接口的行为说明如下。

本接口把项目文档物化成一个独立副本放进会话。

来源文档保持不变。项目文档不会被修改。

来源项目已归档时，文档仍然可以附加。归档项目的文档保持可读。

文件命名基于会话已有的上传文件做占用检查。同名文件不会被静默覆盖。副本会落在占用后的唯一名称下。例如`report_1.txt`。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应只有在摄取成功后才会返回。

响应字段说明如下。

- `filename`：会话中实际使用的文件名。字符串类型。占用检查后的唯一名称。
- `size_bytes`：文件字节大小。整数类型。
- `virtual_path`：文件的虚拟路径。字符串类型。
- `artifact_url`：文件的访问URL。字符串类型。

文档内容缺失或大小不匹配时返回409。错误详情是`content_missing`。

摄取失败时返回500。

响应示例来自源码响应模型推导。

```json
{
  "filename": "报告.txt",
  "size_bytes": 1024,
  "virtual_path": "uploads/报告.txt",
  "artifact_url": "/api/threads/th_abc/artifacts/uploads/报告.txt"
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/projects/p_123/documents/doc_001/attach-to-thread/th_abc \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s -X POST http://localhost:8001/api/projects/p_123/documents/doc_001/attach-to-thread/th_abc \
  -H "Cookie: access_token=<token>"
```
