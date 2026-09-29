# 删除线程本地数据

## 接口地址

接口地址是`DELETE /api/threads/{thread_id}`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:delete`。
这个接口要求调用者是线程的所有者。线程必须已存在。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起DELETE请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。

## 响应出参
响应体来自`ThreadDeleteResponse`模型。响应示例来自源码响应模型推导。
这个接口删除DeerFlow管理的线程目录。同时清理检查点数据、历史运行、运行事件、反馈和thread_meta行。还会关闭该线程的浏览器会话。
- `success`：布尔值。是否删除成功。
- `message`：字符串。结果说明。

线程有工作在运行中时返回409。
响应示例。
```json
{
  "success": true,
  "message": "Deleted local data for f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

## curl命令
```bash
curl -X DELETE "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Authorization: Bearer <token>"
```
