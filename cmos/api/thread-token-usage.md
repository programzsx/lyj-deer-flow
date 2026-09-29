# 获取线程token用量聚合

## 接口地址

接口地址是`GET /api/threads/{thread_id}/token-usage`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/token-usage`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。

## 请求入参
这个接口没有请求体。参数通过查询字符串传递。
- `include_active`：布尔值。是否包含运行中运行的进度快照。默认false。

## 响应出参
响应体来自`ThreadTokenUsageResponse`模型。响应示例来自源码响应模型推导。
- `thread_id`：字符串。线程ID。
- `total_tokens`：整数。token总数。
- `total_input_tokens`：整数。输入token总数。
- `total_output_tokens`：整数。输出token总数。
- `total_runs`：整数。运行总数。
- `by_model`：对象。按模型的用量分解。每个键是模型名。每个值包含`tokens`和`runs`。`tokens`是该模型消耗的token。`runs`是该模型出现的运行数。多模型运行的计数不互斥。
- `by_caller`：对象。按调用方的用量分解。包含`lead_agent`、`subagent`、`middleware`。
- `context_usage`：对象或null。上下文使用情况。包含`token_count`、`max_context_tokens`、`percentage`。`percentage`基于最新运行的模型及其上下文窗口。

响应示例。
```json
{
  "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "total_tokens": 165,
  "total_input_tokens": 120,
  "total_output_tokens": 45,
  "total_runs": 1,
  "by_model": {
    "deepseek-chat": {
      "tokens": 165,
      "runs": 1
    }
  },
  "by_caller": {
    "lead_agent": 165,
    "subagent": 0,
    "middleware": 0
  },
  "context_usage": {
    "token_count": 165,
    "max_context_tokens": 65536,
    "percentage": 0.25
  }
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/token-usage?include_active=false" \
  -H "Authorization: Bearer <token>"
```
