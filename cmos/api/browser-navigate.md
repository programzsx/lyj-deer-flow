# 导航实时浏览器会话

## 接口地址

请求方法是`POST`。

完整路径是`/api/threads/{thread_id}/browser/navigate`。

网关端口是8001。

完整地址是`http://localhost:8001/api/threads/{thread_id}/browser/navigate`。

路径参数`thread_id`是会话线程ID。

线程不存在或线程不属于调用者时返回404。

浏览器自动化未启用时返回404。

Playwright依赖不可用时返回501。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:write`权限。

本接口需要线程属主校验。

本接口要求线程属主严格匹配。

NULL属主的历史线程不被共享。

原因是保留的浏览器页面可能包含已认证的Cookie和页面数据。

本接口是选择启用的能力。

只有操作员在`config.yaml`中启用了`browser_navigate`工具时才可访问。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`BrowserNavigateRequest`模型。

- `url`：要在该线程实时浏览器会话中打开的http(s)地址。必填。字符串。空URL返回400。SSRF或URL校验失败返回400。

本接口没有其他参数。

请求示例。

```json
{
  "url": "https://example.com/report"
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`BrowserNavigateResponse`模型推导。

- `screenshot`：捕获的截图的虚拟产物路径。可为`null`。
- `url`：导航后的解析地址。字符串。
- `title`：导航后的页面标题。默认空字符串。

导航失败时返回502。

错误信息是`Browser navigation failed`。

响应示例来自源码响应模型推导。

```json
{
  "screenshot": "outputs/browser_frames/screenshot-1.jpg",
  "url": "https://example.com/report",
  "title": "Example Report"
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"url":"https://example.com/report"}' http://localhost:8001/api/threads/thread_xyz/browser/navigate
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"url":"https://example.com/report"}' http://localhost:8001/api/threads/thread_xyz/browser/navigate
```
