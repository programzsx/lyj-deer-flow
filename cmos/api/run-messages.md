# 运行消息列表接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/runs/{run_id}/messages`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/runs/run_123/messages`。

路径参数说明如下。

- `run_id`：运行ID。字符串类型。表示要查询消息的运行。

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

源码使用装饰器`@require_permission("runs", "read")`。

调用者需要`runs:read`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`runs:read`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

运行不存在或不属于调用者时返回404。

## 请求入参

路径参数说明如下。

- `run_id`：运行ID。字符串类型。表示要查询消息的运行。

查询参数说明如下。

- `limit`：单页数量。整数类型。可选。默认值是50。最小值是1。最大值是200。
- `before_seq`：向前分页游标。整数类型。可选。默认值是`null`。最小值是1。返回序号小于`before_seq`的消息。
- `after_seq`：向后分页游标。整数类型。可选。默认值是`null`。最小值是1。返回序号大于`after_seq`的消息。

分页规则说明如下。

传入`after_seq`时，返回序号大于该游标的消息。这是向前翻页。

传入`before_seq`时，返回序号小于该游标的消息。这是向后翻页。

两个游标都不传时，返回最新的消息。

本接口没有请求体。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `data`：消息列表。数组类型。每个元素是一条消息记录。
- `has_more`：是否还有更多消息。布尔类型。

响应示例来自源码响应模型推导。

```json
{
  "data": [
    {
      "seq": 1,
      "role": "user",
      "content": "帮我分析这份数据"
    },
    {
      "seq": 2,
      "role": "assistant",
      "content": "分析完成"
    }
  ],
  "has_more": false
}
```

## curl命令

```bash
curl -s "http://localhost:8001/api/runs/run_123/messages?limit=50" \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s "http://localhost:8001/api/runs/run_123/messages?limit=50" \
  -H "Cookie: access_token=<token>"
```
