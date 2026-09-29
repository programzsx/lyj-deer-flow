# 导出批次结果接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/threads/{thread_id}/subagent-batches/{batch_id}/results.jsonl`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/results.jsonl`。
- 路径参数`thread_id`是会话线程的ID。
- 路径参数`batch_id`是子智能体批次的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "read", owner_check=True)`。
- 调用者需要`threads:read`权限。
- 权限校验带所有者检查。调用者必须是该线程的所有者。
- 未登录时返回401。
- 批次不存在、不属于当前用户或线程ID不匹配时返回404。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。
- 路径参数`thread_id`是线程ID。
- 路径参数`batch_id`是批次ID。

行为说明：

- 本接口以流式响应返回NDJSON格式的结果文件。
- 响应的媒体类型是`application/x-ndjson`。
- 响应带有`Content-Disposition: attachment`头。文件名是`{batch_id}-results.jsonl`。
- 服务端每页读取500条。逐行流式输出。每行是一个JSON对象。

## 响应出参

- 响应体是NDJSON文本。每行是一个条目对象的JSON。
- 条目对象包含批次条目列表接口的全部字段。每行额外包含`result`字段。`result`是条目的完整结果文本。
- 响应示例来自源码响应模型推导。

响应示例：

```jsonl
{"id":"item-001","batch_id":"batch-001","item_key":"doc-1","position":0,"status":"succeeded","attempt":1,"model_name":"deepseek-chat","result_preview":"文档分析了前200字……","result_truncated":true,"error":null,"stop_reason":null,"token_usage":{"input_tokens":1200,"output_tokens":800},"acceptance_criteria":["输出包含摘要"],"acceptance_verdict":{"passed":true},"started_at":"2026-09-29T08:01:00+00:00","completed_at":"2026-09-29T08:02:30+00:00","created_at":"2026-09-29T08:00:00+00:00","updated_at":"2026-09-29T08:02:30+00:00","result":"完整的结果文本"}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/results.jsonl" \
  -b "access_token=<token>" \
  -OJ
```
