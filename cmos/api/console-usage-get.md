# 获取token用量序列

## 接口地址

请求方法是`GET`。

完整路径是`/api/console/usage`。

网关端口是8001。

完整地址是`http://localhost:8001/api/console/usage`。

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

本接口有2个查询参数。

- `days`：统计窗口天数。可选。取值1到90。默认14。
- `tz_offset_minutes`：本地时间相对UTC的偏移分钟数。可选。取值-840到840。默认0。用于按本地日分桶。

本接口没有请求体。

请求示例。

```
GET /api/console/usage?days=14&tz_offset_minutes=480 HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`ConsoleUsageResponse`模型推导。

- `days`：按本地日聚合的用量数组。零填充。窗口内的每一天都有条目。
- `by_model`：按模型分解的用量字典。键是模型名称。值是该模型的用量对象。
- `total_tokens`：窗口内的token总数。整数。
- `total_runs`：窗口内的运行总数。整数。
- `total_cost`：窗口内按已定价模型估算的总花费。可为`null`。未配置定价时为`null`。
- `currency`：显示货币。取自第一个已配置的定价条目。可为`null`。

`days`数组中每个元素的字段来自源码`ConsoleUsageDay`模型推导。

- `date`：本地日期。格式`YYYY-MM-DD`。按请求的时区偏移计算。
- `total_tokens`：当天的token总数。整数。默认0。
- `input_tokens`：当天的输入token数。整数。默认0。
- `output_tokens`：当天的输出token数。整数。默认0。
- `runs`：当天的运行数。整数。默认0。
- `cost`：当天按已定价模型估算的花费。数字。默认0.0。

`by_model`字典中每个值来自源码`ConsoleUsageModelBreakdown`模型推导。

- `tokens`：该模型的token数。整数。默认0。
- `runs`：使用该模型的运行数。非独占计数。整数。默认0。
- `cost`：该模型的花费。可为`null`。未定价时为`null`。
- `input_tokens`：该模型的输入token数。整数。默认0。
- `cache_read_tokens`：该模型的提示缓存命中输入token数。整数。默认0。

未配置SQL数据库后端时返回503。

响应示例来自源码响应模型推导。

```json
{
  "days": [
    {
      "date": "2024-01-15",
      "total_tokens": 12345,
      "input_tokens": 10000,
      "output_tokens": 2345,
      "runs": 5,
      "cost": 0.123456
    },
    {
      "date": "2024-01-16",
      "total_tokens": 0,
      "input_tokens": 0,
      "output_tokens": 0,
      "runs": 0,
      "cost": 0.0
    }
  ],
  "by_model": {
    "gpt-4": {
      "tokens": 12345,
      "runs": 5,
      "cost": 0.123456,
      "input_tokens": 10000,
      "cache_read_tokens": 2000
    }
  },
  "total_tokens": 12345,
  "total_runs": 5,
  "total_cost": 0.123456,
  "currency": "USD"
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:8001/api/console/usage?days=14&tz_offset_minutes=480"
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" "http://localhost:8001/api/console/usage?days=14&tz_offset_minutes=480"
```
