# 加入已有运行流并可选取消

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs/{run_id}/stream`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/{run_id}/stream`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。
路径参数`run_id`是运行ID。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:read`。
携带`action`查询参数时还需要`runs:cancel`权限。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。
同一地址的GET请求是只读观察。GET请求携带`action`会返回405。`Allow`头指明只支持POST。

## 请求入参
这个接口没有请求体。参数通过查询字符串传递。
- `action`：枚举`interrupt`或`rollback`或空。取消动作。默认null。提供这个参数时先取消运行再流式返回剩余事件。
- `wait`：整数。是否阻塞到取消完成。1表示阻塞。0表示立即返回。默认0。

## 响应出参
这个接口加入一个已有运行的SSE事件流。
响应的媒体类型是`text/event-stream`。
响应示例来自源码响应模型推导。
响应头包含以下字段。
- `Cache-Control`：值是`no-cache`。
- `Connection`：值是`keep-alive`。
- `X-Accel-Buffering`：值是`no`。

响应体是SSE事件流。事件格式与LangGraph Platform协议对齐。
携带`action`时先取消运行，再流出剩余缓冲事件，客户端能看到干净的关闭。
取消在另一个worker上被接管时返回202。
运行不在本worker上活跃时返回409。运行不可取消时返回409。
SSE事件示例。
```
event: messages
data: {"type":"ai","content":"好的，我来继续。"}

event: end
data: {}
```

## curl命令
```bash
curl -N -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/stream?action=interrupt&wait=0" \
  -H "Authorization: Bearer <token>"
```
