# 列出线程的运行

## 接口地址

接口地址是`GET /api/threads/{thread_id}/runs`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。

## 请求入参
这个接口没有请求体。
这个接口没有查询参数。
返回结果默认是最新的100条运行记录。

## 响应出参
响应体是一个数组。每个元素来自`RunResponse`模型。响应示例来自源码响应模型推导。
- `run_id`：字符串。运行ID。
- `thread_id`：字符串。线程ID。
- `assistant_id`：字符串或null。助手ID。
- `status`：字符串。运行状态。取值是`pending`、`running`、`success`、`error`、`timeout`、`interrupted`。
- `metadata`：对象。运行元数据。服务端会脱敏其中的敏感配置。
- `kwargs`：对象。运行参数。其中`config`的敏感项会被脱敏。
- `multitask_strategy`：字符串。并发策略。
- `created_at`：字符串。创建时间。
- `updated_at`：字符串。更新时间。
- `total_input_tokens`：整数。输入token总数。
- `total_output_tokens`：整数。输出token总数。
- `total_tokens`：整数。token总数。
- `llm_call_count`：整数。LLM调用次数。
- `lead_agent_tokens`：整数。主代理消耗的token。
- `subagent_tokens`：整数。子代理消耗的token。
- `middleware_tokens`：整数。中间件消耗的token。
- `message_count`：整数。消息数量。
- `stop_reason`：字符串或null。停止原因。

响应示例。
```json
[
  {
    "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "assistant_id": null,
    "status": "success",
    "metadata": {},
    "kwargs": {},
    "multitask_strategy": "reject",
    "created_at": "2026-09-29T08:00:00+00:00",
    "updated_at": "2026-09-29T08:00:05+00:00",
    "total_input_tokens": 120,
    "total_output_tokens": 45,
    "total_tokens": 165,
    "llm_call_count": 1,
    "lead_agent_tokens": 165,
    "subagent_tokens": 0,
    "middleware_tokens": 0,
    "message_count": 2,
    "stop_reason": null
  }
]
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs" \
  -H "Authorization: Bearer <token>"
```
