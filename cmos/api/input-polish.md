# 润色输入草稿

## 接口地址

请求方法是`POST`。

完整路径是`/api/input-polish`。

网关端口是8001。

完整地址是`http://localhost:8001/api/input-polish`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`runs:create`权限。

本接口使用`input_polish`配置发起一次短LLM请求。

本接口不会创建LangGraph运行。

本接口不会持久化任何消息。

本接口不会修改线程状态。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`InputPolishRequest`模型。

- `text`：输入框中当前显示的草稿文本。必填。字符串。去除首尾空白后不能为空。为空返回400。超过配置的`max_chars`长度时返回400。
- `locale`：可选的UI语言提示。可为`null`。
- `thread_id`：可选的线程ID。仅用于追踪。可为`null`。

功能关闭（`input_polish.enabled`为`false`）时返回404。

错误信息是`Input polishing is disabled`。

LLM失败时返回503。

错误信息是`Failed to polish input`。

请求示例。

```json
{
  "text": "帮我看看这个报告写得好不好",
  "locale": "zh-CN",
  "thread_id": "thread_xyz"
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`InputPolishResponse`模型推导。

- `rewritten_text`：润色后的草稿文本。字符串。
- `changed`：模型是否修改了原始草稿。布尔值。

改写会保留用户的语言、意图、实体、文件路径、URL、代码块和斜杠命令前缀。

改写不发明事实。

改写输出不包含markdown包装。

响应示例来自源码响应模型推导。

```json
{
  "rewritten_text": "请审阅这份报告。评估报告的结构完整性、论证清晰度和数据准确性。指出需要改进的部分并给出具体建议。",
  "changed": true
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"text":"帮我看看这个报告写得好不好","locale":"zh-CN","thread_id":"thread_xyz"}' http://localhost:8001/api/input-polish
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"text":"帮我看看这个报告写得好不好","locale":"zh-CN","thread_id":"thread_xyz"}' http://localhost:8001/api/input-polish
```
