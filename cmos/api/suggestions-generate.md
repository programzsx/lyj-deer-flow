# 生成追问建议

## 接口地址

请求方法是`POST`。

完整路径是`/api/threads/{thread_id}/suggestions`。

网关端口是8001。

完整地址是`http://localhost:8001/api/threads/{thread_id}/suggestions`。

路径参数`thread_id`是会话线程ID。

线程ID用于追踪和归属校验。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:read`权限。

本接口需要线程属主校验。

只有线程属主可以调用本接口。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`SuggestionsRequest`模型。

- `messages`：最近的会话消息。必填。数组。每个元素包含`role`和`content`。空数组时返回空建议列表。
- `n`：要生成的建议数。可选。取值1到上限。默认值来自全局配置。
- `model_name`：可选的模型覆盖。可为`null`。

`messages`数组中每个元素的字段来自源码`SuggestionMessage`模型。

- `role`：消息角色。必填。取值是`user`或`assistant`。
- `content`：消息内容。必填。纯文本。

全局建议关闭时返回空建议列表。

开启授权时需要`model:use`权限。

显式拒绝时返回403。

不会调用模型。

LLM失败时返回空建议列表。

响应不会报错。

请求示例。

```json
{
  "messages": [
    {"role": "user", "content": "帮我分析这个数据集"},
    {"role": "assistant", "content": "我已经完成了初步分析"}
  ],
  "n": 3
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`SuggestionsResponse`模型推导。

- `suggestions`：建议的追问问题数组。字符串数组。默认空数组。

每个建议是简短的追问问题。

建议不会包含编号和markdown。

响应示例来自源码响应模型推导。

```json
{
  "suggestions": [
    "数据集有哪些主要字段？",
    "可以帮我画一张分布图吗？",
    "下一步该做什么分析？"
  ]
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"帮我分析这个数据集"},{"role":"assistant","content":"我已经完成了初步分析"}],"n":3}' http://localhost:8001/api/threads/thread_xyz/suggestions
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"帮我分析这个数据集"},{"role":"assistant","content":"我已经完成了初步分析"}],"n":3}' http://localhost:8001/api/threads/thread_xyz/suggestions
```
