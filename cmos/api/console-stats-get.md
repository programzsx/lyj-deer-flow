# 获取控制台统计

## 接口地址

请求方法是`GET`。

完整路径是`/api/console/stats`。

网关端口是8001。

完整地址是`http://localhost:8001/api/console/stats`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`runs:read`权限。

统计范围限定为当前用户。

本接口是只读的可观测性接口。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/console/stats HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`ConsoleStatsResponse`模型推导。

- `total_runs`：当前用户的全部已记录运行数。整数。
- `active_runs`：当前处于pending或running状态的运行数。整数。
- `failed_runs`：以error或timeout结束的运行数。整数。
- `total_threads`：当前用户拥有的会话线程数。整数。
- `total_agents`：当前用户拥有的自定义代理数。整数。
- `total_tokens`：全部已记录运行消耗的token总数。整数。
- `total_cost`：按已定价模型估算的总花费。可为`null`。未配置`models[*].pricing`时为`null`。
- `currency`：显示货币。取自第一个已配置的定价条目。可为`null`。

未配置SQL数据库后端时返回503。

响应示例来自源码响应模型推导。

```json
{
  "total_runs": 120,
  "active_runs": 2,
  "failed_runs": 3,
  "total_threads": 45,
  "total_agents": 6,
  "total_tokens": 1234567,
  "total_cost": 12.345678,
  "currency": "USD"
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/console/stats
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/console/stats
```
