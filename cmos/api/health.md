# 存活探针

## 接口地址

请求方法是`GET`。

完整路径是`/health`。

网关端口是8001。

完整地址是`http://localhost:8001/health`。

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
GET /health HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码返回值推导。

- `status`：服务健康状态。固定为`healthy`。
- `service`：服务名称。固定为`deer-flow-gateway`。

本接口是存活探针。

本接口只报告进程存活。

本接口不探测持久化后端。

持久化就绪探测使用`/health/ready`。

响应示例来自源码响应模型推导。

```json
{
  "status": "healthy",
  "service": "deer-flow-gateway"
}
```

## curl命令

```bash
curl http://localhost:8001/health
```
