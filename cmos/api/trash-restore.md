# 回收站文档恢复接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/trash/documents/{document_id}/restore`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/trash/documents/doc_001/restore`。

路径参数说明如下。

- `document_id`：文档ID。字符串类型。表示要恢复的回收站文档。

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

本接口不需要admin权限。

本接口全部路径失败关闭。文档不存在或不属于调用者时返回404。目标项目是归档项目或别人的项目时也是404。

## 请求入参

路径参数说明如下。

- `document_id`：文档ID。字符串类型。表示要恢复的回收站文档。

请求体是JSON对象。请求体可以省略。

请求字段说明如下。

- `project_id`：目标项目ID。字符串类型或`null`。可选。默认值是`null`。表示要恢复进的项目。

目标项目的选取规则说明如下。

请求体给出了`project_id`时，该值是目标项目。

请求体没有给出`project_id`时，源码使用`trash_origin.project_id`作为候选目标。

候选目标必须仍然存在。候选目标必须属于调用者。候选目标必须是激活状态。

候选目标不满足条件时返回404。此时界面应提供项目选择器。

请求示例来自源码请求模型推导。

```json
{
  "project_id": "p_123"
}
```

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `outcome`：恢复结果。字符串类型。取值是`restored`或`merged`。`restored`表示正常恢复。`merged`表示目标项目已有完全相同字节的活动文档。`merged`时回收站行被删除。`document`字段返回存活的活动文档。
- `document`：恢复后的项目文档。对象类型。

`document`对象的字段说明如下。

- `id`：文档ID。字符串类型。
- `name`：文档名称。字符串类型。
- `size_bytes`：文档字节大小。整数类型。
- `sha256`：文档内容的SHA-256摘要。字符串类型。
- `source_thread_id`：来源会话ID。字符串类型或`null`。
- `source_kind`：来源类型。字符串类型或`null`。
- `source_name`：来源名称。字符串类型或`null`。
- `created_at`：创建时间。字符串类型。ISO格式。
- `updated_at`：更新时间。字符串类型。ISO格式。
- `content_missing`：原始文件是否缺失或大小不匹配。布尔类型。默认值是`false`。

文档内容缺失或大小不匹配时返回409。错误详情是`content_missing`。此时回收站行保持不变。

响应示例来自源码响应模型推导。

```json
{
  "outcome": "restored",
  "document": {
    "id": "doc_001",
    "name": "报告.md",
    "size_bytes": 1024,
    "sha256": "abc123",
    "source_thread_id": "th_abc",
    "source_kind": "output",
    "source_name": "报告.md",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-04T00:00:00Z",
    "content_missing": false
  }
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/trash/documents/doc_001/restore \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "p_123"}'
```

session cookie方式的curl命令如下。

```bash
curl -s -X POST http://localhost:8001/api/trash/documents/doc_001/restore \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "p_123"}'
```
