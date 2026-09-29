# 获取上传限制

## 接口地址

请求方法是`GET`。

完整路径是`/api/threads/{thread_id}/uploads/limits`。

网关端口是8001。

完整地址是`http://localhost:8001/api/threads/{thread_id}/uploads/limits`。

路径参数`thread_id`是会话线程ID。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:read`权限。

本接口需要线程属主校验。

## 请求入参

本接口有1个路径参数。

- `thread_id`：会话线程ID。必填。字符串。

本接口没有查询参数。

本接口没有请求体。

请求示例。

```
GET /api/threads/thread_xyz/uploads/limits HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`UploadLimits`模型推导。

- `max_files`：单次上传的最大文件数。整数。默认10。取自`uploads.max_files`配置。旧配置键是`max_file_count`。
- `max_file_size`：单个文件的大小上限。字节数。整数。默认52428800（50MiB）。取自`uploads.max_file_size`配置。旧配置键是`max_single_file_size`。
- `max_total_size`：单次上传的总大小上限。字节数。整数。默认104857600（100MiB）。取自`uploads.max_total_size`配置。

配置值无效时回退到默认值。

响应示例来自源码响应模型推导。

```json
{
  "max_files": 10,
  "max_file_size": 52428800,
  "max_total_size": 104857600
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/threads/thread_xyz/uploads/limits
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/threads/thread_xyz/uploads/limits
```
