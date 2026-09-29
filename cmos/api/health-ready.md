# 就绪探针

## 接口地址

请求方法是`GET`。

完整路径是`/health/ready`。

网关端口是8001。

完整地址是`http://localhost:8001/health/ready`。

本接口没有路径参数。

本接口位于根路径下。

本接口不在`/api`前缀下。

## 接口鉴权

本接口是公开接口。

本接口不需要认证。

本接口在auth中间件的公开路径前缀列表中。

无需会话Cookie。

无需token。

无需任何请求头。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /health/ready HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`readiness_payload`逻辑推导。

- `status`：就绪状态。取值是`ready`或`degraded`。两个后端都可达时为`ready`。任一后端不可达时为`degraded`。
- `service`：服务名称。固定为`deer-flow-gateway`。
- `database`：ORM数据库引擎探测结果。字符串。
- `checkpointer`：LangGraph checkpointer/Store后端探测结果。字符串。

本接口并发探测两个持久化后端。

探测有3秒的端点级截止时间。

探测超时按不可达处理。

checkpointer配置来自启动快照。

启动快照不会热重载。

编排器可以以本接口为网关就绪条件。

探测失败或启动后端无法解析时返回503。

503时`status`为`degraded`。

后端不可达时对应字段值为`unreachable`。

进程内后端如`memory`报告`not_configured`。

响应示例来自源码响应模型推导。

```json
{
  "status": "ready",
  "service": "deer-flow-gateway",
  "database": "ok",
  "checkpointer": "ok"
}
```

降级时的响应示例。

```json
{
  "status": "degraded",
  "service": "deer-flow-gateway",
  "database": "unreachable",
  "checkpointer": "ok"
}
```

## curl命令

```bash
curl http://localhost:8001/health/ready
```

查看状态码。

```bash
curl -i http://localhost:8001/health/ready
```
