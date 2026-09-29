# 获取记忆配置

## 接口地址

请求方法是`GET`。

完整路径是`/api/memory/config`。

网关端口是8001。

完整地址是`http://localhost:8001/api/memory/config`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`memory:read`权限。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/memory/config HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`MemoryConfigResponse`模型推导。

- `enabled`：记忆机制是否启用。布尔值。
- `mode`：记忆操作模式。取值是`middleware`、`tool`之一。`middleware`表示每轮LLM摘要。`tool`表示模型直接调用记忆工具。
- `injection_enabled`：记忆是否注入系统提示。布尔值。
- `shutdown_flush_timeout_seconds`：Gateway优雅关闭时排空待处理记忆更新的硬预算秒数。
- `manager_class`：当前记忆后端选择器。是后端名称或点分路径。
- `backend_config`：后端私有配置。是一个字典。由当前后端自行解释。

响应是后端无关的。

`enabled`、`injection_enabled`、`mode`是机制级字段。

`backend_config`是不透明字典。

DeerMem的配置项在`backend_config`内。

DeerMem的配置项不是顶层字段。

响应示例来自源码响应模型推导。

```json
{
  "enabled": true,
  "mode": "middleware",
  "injection_enabled": true,
  "shutdown_flush_timeout_seconds": 30.0,
  "manager_class": "deermem",
  "backend_config": {
    "storage_path": "/path/.deer-flow",
    "debounce_seconds": 30,
    "max_facts": 100,
    "fact_confidence_threshold": 0.7,
    "max_injection_tokens": 2000,
    "token_counting": "tiktoken"
  }
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/memory/config
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/memory/config
```
