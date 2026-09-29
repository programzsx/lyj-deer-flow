# 无状态阻塞运行接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/runs/wait`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/runs/wait`。

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

源码使用装饰器`@require_permission("runs", "create")`。

调用者需要`runs:create`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`runs:create`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

请求体中显式提供`thread_id`时，网关会校验该会话的归属。

## 请求入参

请求体是`RunCreateRequest`模型。模型禁止未知字段。未知字段返回422。

请求字段与无状态流式运行接口相同。

请求字段说明如下。

- `assistant_id`：代理或助手名称。字符串类型或`null`。可选。默认值是`null`。
- `input`：图输入。字典类型或`null`。可选。默认值是`null`。例如`{"messages": [{"role": "user", "content": "你好"}]}`。
- `command`：LangGraph命令。字典类型或`null`。可选。默认值是`null`。
- `metadata`：运行元数据。字典类型或`null`。可选。默认值是`null`。
- `config`：RunnableConfig覆盖。字典类型或`null`。可选。默认值是`null`。其中的`configurable.thread_id`用于指定目标会话。
- `context`：DeerFlow上下文覆盖。字典类型或`null`。可选。默认值是`null`。例如`model_name`、`thinking_enabled`。
- `conversation_references`：显式可读会话引用列表。数组类型。可选。默认值是空数组。
- `stream_mode`：流模式。字符串或字符串数组类型。可选。默认值是`null`。
- `multitask_strategy`：并发策略。字符串类型。可选。默认值是`reject`。取值是`reject`、`rollback`或`interrupt`。

`thread_id`选择规则说明如下。

请求体没有提供`config.configurable.thread_id`时，源码自动创建一个临时会话。

请求体提供了`config.configurable.thread_id`时，源码复用该会话。这样对话历史可以跨调用保留。

请求示例来自源码请求模型推导。

```json
{
  "assistant_id": "lead_agent",
  "input": {
    "messages": [
      {"role": "user", "content": "帮我分析这份数据"}
    ]
  },
  "config": {
    "configurable": {
      "thread_id": "th_abc"
    }
  }
}
```

## 响应出参

成功返回HTTP 200。

本接口创建运行后阻塞到运行完成。

运行完成且能获取最终状态时，返回最终状态的通道值快照。快照已经序列化为API格式。

运行完成但获取最终状态失败时，返回运行状态对象。

响应字段说明如下。

最终状态快照是状态键到值的字典。常见键说明如下。

- `messages`：最终消息列表。数组类型。

兜底状态对象的字段说明如下。

- `status`：运行状态。字符串类型。例如`succeeded`或`error`。
- `error`：运行错误信息。字符串类型或`null`。

响应示例来自源码响应模型推导。

成功时返回最终状态快照。

```json
{
  "messages": [
    {"role": "user", "content": "帮我分析这份数据"},
    {"role": "assistant", "content": "分析完成"}
  ]
}
```

获取最终状态失败时返回兜底状态对象。

```json
{
  "status": "succeeded",
  "error": null
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/runs/wait \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"assistant_id": "lead_agent", "input": {"messages": [{"role": "user", "content": "帮我分析这份数据"}]}, "config": {"configurable": {"thread_id": "th_abc"}}}'
```

session cookie方式的curl命令如下。

```bash
curl -s -X POST http://localhost:8001/api/runs/wait \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"assistant_id": "lead_agent", "input": {"messages": [{"role": "user", "content": "帮我分析这份数据"}]}}'
```
