# 项目文档保存到会话接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/projects/{project_id}/documents/from-thread`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123/documents/from-thread`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示目标项目。

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

装饰器是`@require_permission("projects", "write")`和`@require_permission("threads", "read")`。

调用者需要`projects:write`权限。

调用者同时需要`threads:read`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域同时包含两个权限。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

项目不存在、不属于调用者或已归档时返回404。源文件不满足路径约束时也是404。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示目标项目。

请求体是JSON对象。

请求字段说明如下。

- `thread_id`：来源会话ID。字符串类型。必填。表示文件所在的会话。会话不存在时返回404。
- `kind`：文件类型。字符串类型。必填。取值是`upload`或`output`。`upload`表示会话上传目录。`output`表示会话输出目录。
- `name`：来源文件名。字符串类型。必填。表示会话目录中的文件名。
- `shelf_name`：保存到项目时的名称。字符串类型或`null`。可选。默认值是`null`。不传时使用来源文件名。该名称遵循上传名称校验。名称为空、含分隔符或超过255个UTF-8字节时返回400。

本接口只复制文件。来源文件不会被移动。项目获得一个带来源信息的快照。删除会话不会影响该快照。

请求示例来自源码请求模型推导。

```json
{
  "thread_id": "th_abc",
  "kind": "output",
  "name": "报告.md",
  "shelf_name": "市场分析报告.md"
}
```

## 响应出参

成功返回HTTP 201。

内容去重命中时返回HTTP 200。去重命中时已存在的文档行保留自己的名称和来源信息。

响应字段说明如下。

- `document`：保存后的项目文档。对象类型。
- `deduplicated`：是否发生内容去重。布尔类型。`true`表示目标项目已有完全相同字节的活动文档。

`document`对象的字段说明如下。

- `id`：文档ID。字符串类型。
- `name`：文档名称。字符串类型。
- `size_bytes`：文档字节大小。整数类型。
- `sha256`：文档内容的SHA-256摘要。字符串类型。
- `source_thread_id`：来源会话ID。字符串类型或`null`。返回请求中的`thread_id`。
- `source_kind`：来源类型。字符串类型或`null`。返回请求中的`kind`。
- `source_name`：来源名称。字符串类型或`null`。返回请求中的`name`。
- `created_at`：创建时间。字符串类型。ISO格式。
- `updated_at`：更新时间。字符串类型。ISO格式。
- `content_missing`：原始文件是否缺失。布尔类型。默认值是`false`。

文件超过大小上限时返回413。文件为空时返回400。

响应示例来自源码响应模型推导。

```json
{
  "document": {
    "id": "doc_001",
    "name": "市场分析报告.md",
    "size_bytes": 1024,
    "sha256": "abc123",
    "source_thread_id": "th_abc",
    "source_kind": "output",
    "source_name": "报告.md",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
    "content_missing": false
  },
  "deduplicated": false
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/projects/p_123/documents/from-thread \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "th_abc", "kind": "output", "name": "报告.md", "shelf_name": "市场分析报告.md"}'
```

session cookie方式的curl命令如下。

```bash
curl -s -X POST http://localhost:8001/api/projects/p_123/documents/from-thread \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "th_abc", "kind": "output", "name": "报告.md"}'
```
