# 获取检索范围文档目录

## 接口地址

请求方法是`GET`。

完整路径是`/api/knowledge/retrieval-catalog/datasets/{dataset_id}/documents`。

网关端口是8001。

完整地址是`http://localhost:8001/api/knowledge/retrieval-catalog/datasets/{dataset_id}/documents`。

路径参数`dataset_id`是RAGFlow数据集ID。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:read`权限。

本接口是只读目录接口。

RAGFlow凭据和原始payload不会暴露。

## 请求入参

本接口有1个路径参数。

- `dataset_id`：数据集ID。必填。取值1到256字符。必须匹配`^[A-Za-z0-9_-]+$`。

本接口有4个查询参数。

- `agent_name`：代理名称。必填。取值1到128字符。用于校验该代理是否支持知识范围选择。
- `page`：页码。可选。最小值1。默认1。该参数直接传给RAGFlow。
- `page_size`：每页条数。可选。取值1到100。默认20。该参数直接传给RAGFlow。
- `search`：文档关键词过滤。可选。最大256字符。非空时作为`keywords`传给RAGFlow。默认空。

本接口没有请求体。

校验失败的错误状态。

数据集不在操作员允许范围时返回404。

RAGFlow解析不到该数据集时返回404。

错误信息是`Knowledge base not found.`。

知识库未开启或范围选择未开启时返回409。

代理不支持知识范围选择时返回409。

知识检索未配置时返回503。

RAGFlow失败时返回502。

RAGFlow返回非法文档列表时返回502。

请求示例。

```
GET /api/knowledge/retrieval-catalog/datasets/dataset_abc123/documents?agent_name=lead_agent&page=1&page_size=20 HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码返回值推导。

- `items`：文档条目数组。只包含有效ID的文档。
- `page`：当前页码。整数。
- `page_size`：每页条数。整数。
- `total`：文档总数。RAGFlow返回非法总数时回退为条目数。

`items`数组中每个元素的字段来自源码返回值推导。

- `id`：RAGFlow文档ID。字符串。
- `name`：文档名称。字符串。缺失时回退为`Unnamed document`。
- `selectable`：是否可以选择。布尔值。文档解析完成且分块数大于0时为`true`。

响应示例来自源码响应模型推导。

```json
{
  "items": [
    {
      "id": "doc_001",
      "name": "Installation Guide.pdf",
      "selectable": true
    },
    {
      "id": "doc_002",
      "name": "Draft Notes.docx",
      "selectable": false
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 2
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:8001/api/knowledge/retrieval-catalog/datasets/dataset_abc123/documents?agent_name=lead_agent&page=1&page_size=20"
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" "http://localhost:8001/api/knowledge/retrieval-catalog/datasets/dataset_abc123/documents?agent_name=lead_agent&page=1&page_size=20"
```
