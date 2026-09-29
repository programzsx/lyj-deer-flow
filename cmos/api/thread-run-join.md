# 加入运行的SSE流

## 接口地址

接口地址是`GET /api/threads/{thread_id}/runs/{run_id}/join`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/{run_id}/join`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。
路径参数`run_id`是运行ID。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。
运行不存在或不属于这个线程时返回404。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。
- `run_id`：字符串。运行ID。

## 响应出参
这个接口加入一个已有运行的SSE事件流。
响应的媒体类型是`text/event-stream`。
这个接口是只读观察。观察者断开连接不会触发创建者的断开取消策略。
响应示例来自源码响应模型推导。
响应头包含以下字段。
- `Cache-Control`：值是`no-cache`。
- `Connection`：值是`keep-alive`。
- `X-Accel-Buffering`：值是`no`。

响应体是SSE事件流。事件格式与LangGraph Platform协议对齐。
SSE事件示例。
```
event: messages
data: {"type":"ai","content":"好的，我来继续。"}

event: end
data: {}
```
运行不在本worker上活跃时返回409。

## curl命令
```bash
curl -N -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/join" \
  -H "Authorization: Bearer <token>"
```
