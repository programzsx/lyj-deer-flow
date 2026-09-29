# Cron表达式预览接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/scheduled-tasks/preview-cron`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/scheduled-tasks/preview-cron`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "read")`。
- 调用者需要`threads:read`权限。
- 未登录时返回401。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 请求体是JSON对象。

参数说明：

- `cron`：字符串。必填。长度1到256。cron表达式。必须正好包含5个字段。
- `timezone`：字符串。必填。长度1到128。IANA时区名称。例如`Asia/Shanghai`。
- `count`：整数。可选。默认值是5。取值范围是1到10。预览的未来触发次数。
- `start_at`：字符串或null。可选。带时区的ISO时间。预览的参考起点。省略时使用当前UTC时间。

行为说明：

- 本接口只做预览。不创建任务。不派发执行。
- 服务端按调度器相同的语义计算未来触发点。
- 计算在后台线程执行。保持DST语义。
- cron表达式无法产生未来触发点时返回422。

请求示例：

```json
{
  "cron": "0 9 * * *",
  "timezone": "Asia/Shanghai",
  "count": 3
}
```

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `cron`：字符串。归一化后的cron表达式。空白会被归一化。
- `timezone`：字符串。请求中的时区名称。
- `start_at`：字符串。预览参考起点。UTC格式的ISO时间。
- `occurrences`：数组。未来触发点列表。

`occurrences`数组元素字段说明：

- `run_at`：字符串。下一次触发的UTC时间。ISO格式。
- `local_time`：字符串。下一次触发的本地时间。带时区偏移的ISO格式。

响应示例：

```json
{
  "cron": "0 9 * * *",
  "timezone": "Asia/Shanghai",
  "start_at": "2026-09-29T08:00:00+00:00",
  "occurrences": [
    {
      "run_at": "2026-09-30T01:00:00+00:00",
      "local_time": "2026-09-30T09:00:00+08:00"
    },
    {
      "run_at": "2026-10-01T01:00:00+00:00",
      "local_time": "2026-10-01T09:00:00+08:00"
    },
    {
      "run_at": "2026-10-02T01:00:00+00:00",
      "local_time": "2026-10-02T09:00:00+08:00"
    }
  ]
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/scheduled-tasks/preview-cron" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cron": "0 9 * * *",
    "timezone": "Asia/Shanghai",
    "count": 3
  }'
```
