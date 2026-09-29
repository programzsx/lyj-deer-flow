# 获取运行产物归档清单

## 接口地址

接口地址是`GET /api/threads/{thread_id}/runs/{run_id}/artifacts/archive`。
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
GET请求不需要CSRF头。
运行不存在时返回404。运行还在进行中时返回409。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。
- `run_id`：字符串。运行ID。

## 响应出参
这个接口返回归档使用的已验证终态交付文件数。
响应体来自`ArtifactArchiveManifestResponse`模型。响应示例来自源码响应模型推导。
- `file_count`：整数。已验证交付的文件数。去重后的数量。

响应示例。
```json
{
  "file_count": 2
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/artifacts/archive" \
  -H "Authorization: Bearer <token>"
```
