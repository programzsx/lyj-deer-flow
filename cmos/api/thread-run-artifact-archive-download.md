# 下载运行产物归档

## 接口地址

接口地址是`POST /api/threads/{thread_id}/runs/{run_id}/artifacts/archive`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/{run_id}/artifacts/archive`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。
路径参数`run_id`是运行ID。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:read`。
这个接口要求调用者是线程的所有者。线程必须已存在。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。
运行不存在时返回404。运行还在进行中时返回409。产物正在被修改时返回409。归档并发数超限时返回429。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。
- `run_id`：字符串。运行ID。

## 响应出参
这个接口下载一次终态运行交付的文件的当前内容。
响应的媒体类型是`application/zip`。
响应示例来自源码响应模型推导。
响应头包含以下字段。
- `Content-Disposition`：值是`attachment; filename="artifacts-{run_id}.zip"`。
- `Content-Length`：ZIP文件字节数。
- `Cache-Control`：值是`private, no-store`。
- `X-Content-Type-Options`：值是`nosniff`。

响应体是ZIP文件的二进制流。文件内容来自运行交付时`present_files`列出的路径。

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/artifacts/archive" \
  -H "Authorization: Bearer <token>" \
  -o artifacts.zip
```
