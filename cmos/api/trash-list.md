# 回收站文档列表接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/trash/documents`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/trash/documents`。

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

源码使用装饰器`@require_permission("projects", "read")`。

调用者需要`projects:read`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`projects:read`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

本接口不需要admin权限。

本接口只返回调用者自己的回收站文档。

## 请求入参

查询参数说明如下。

- `limit`：单页数量。整数类型。可选。默认值是100。最小值是1。最大值是1000。
- `offset`：偏移量。整数类型。可选。默认值是0。最小值是0。

本接口没有请求体。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应按回收时间从新到旧排序。

本接口会在列出文档前懒触发保留清扫任务。清扫失败只记录日志。清扫失败不会阻塞列表。

响应字段说明如下。

- `documents`：回收站文档列表。数组类型。
- `total`：回收站文档总数。整数类型。
- `limit`：本次请求的单页数量。整数类型。
- `offset`：本次请求的偏移量。整数类型。

`documents`数组每个元素的字段说明如下。

- `id`：文档ID。字符串类型。
- `name`：文档名称。字符串类型。
- `size_bytes`：文档字节大小。整数类型。
- `sha256`：文档内容的SHA-256摘要。字符串类型。
- `source_thread_id`：来源会话ID。字符串类型或`null`。
- `source_kind`：来源类型。字符串类型或`null`。
- `source_name`：来源名称。字符串类型或`null`。
- `created_at`：创建时间。字符串类型。ISO格式。
- `updated_at`：更新时间。字符串类型。ISO格式。
- `trashed_at`：进入回收站的时间。字符串类型。ISO格式。
- `trash_origin`：进入回收站时的来源快照。对象类型或`null`。

`trash_origin`对象的字段说明如下。

- `project_id`：来源项目ID。字符串类型。
- `project_name`：来源项目名称。字符串类型。

响应示例来自源码响应模型推导。

```json
{
  "documents": [
    {
      "id": "doc_001",
      "name": "报告.md",
      "size_bytes": 1024,
      "sha256": "abc123",
      "source_thread_id": "th_abc",
      "source_kind": "output",
      "source_name": "报告.md",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-02T00:00:00Z",
      "trashed_at": "2026-01-03T00:00:00Z",
      "trash_origin": {
        "project_id": "p_123",
        "project_name": "市场分析"
      }
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

## curl命令

```bash
curl -s "http://localhost:8001/api/trash/documents?limit=100&offset=0" \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s "http://localhost:8001/api/trash/documents?limit=100&offset=0" \
  -H "Cookie: access_token=<token>"
```
