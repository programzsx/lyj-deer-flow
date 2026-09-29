# 调用插件后端动作

## 接口地址

请求方法是`POST`。

完整路径是`/api/plugins/{namespace}/actions/{action_name}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/plugins/{namespace}/actions/{action_name}`。

路径参数`namespace`是插件命名空间。

路径参数`action_name`是插件声明的后端动作名。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

未认证调用返回401。

错误信息是`Authentication required.`。

插件被管理员禁用时返回403。

错误信息是`Plugin disabled by administrator.`。

本接口受插件动作授权策略约束。

策略拒绝时返回403。

授权关闭时不做策略判断。

## 请求入参

本接口有2个路径参数。

- `namespace`：插件命名空间。必填。字符串。插件未安装时返回404。
- `action_name`：后端动作名。必填。字符串。动作未安装时返回404。

本接口有1个可选的请求头。

- `x-deerflow-plugin-viewer`：可选。值为查看者用户ID。值与当前登录用户不一致时返回409。错误信息是`Account changed; reload this plugin view.`。

本接口的请求体是一个JSON对象。

请求体必须是对象。

非对象请求体返回422。

错误信息是`Plugin action requires a JSON object.`。

请求体最大256KiB。

超过限制返回413。

错误信息是`Plugin action input exceeds 256 KiB.`。

动作执行超时是30秒。

设置不可用时返回503。

错误信息是`Plugin settings unavailable.`。

请求示例。

```json
{
  "query": "bookmarks"
}
```

## 响应出参

响应由动作处理器返回。

响应格式取决于具体的插件动作。

动作处理器收到的输入包含请求体对象。

动作处理器收到的上下文包含查看者身份和部署级设置。

响应示例来自源码响应模型推导。实际格式取决于具体动作。

```json
{
  "items": []
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"query":"bookmarks"}' http://localhost:8001/api/plugins/bookmarks/actions/list_bookmarks
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"query":"bookmarks"}' http://localhost:8001/api/plugins/bookmarks/actions/list_bookmarks
```
