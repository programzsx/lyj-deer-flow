# 获取能力目录

## 接口地址

请求方法是`GET`。

完整路径是`/api/capabilities/catalog`。

网关端口是8001。

完整地址是`http://localhost:8001/api/capabilities/catalog`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

任何已认证用户都可以调用本接口。

本接口不需要管理员权限。

本接口不受授权策略过滤。

能力目录对所有认证用户公开。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/capabilities/catalog HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON数组。

数组中每个元素是一个能力清单条目。

响应条目来自源码`PluginManifest`模型推导。

- `schema_version`：清单格式版本。固定为`1`。
- `id`：能力的唯一标识。例如`office-tools`。
- `version`：能力版本号。
- `name`：能力名称。是一个多语言字典。键是语言代码。值是名称文本。
- `description`：能力描述。是一个多语言字典。
- `setup`：安装说明。是一个多语言字典。
- `category`：能力分类。取值是`office`、`knowledge`、`research`、`business`、`development`、`custom`之一。
- `kind`：能力类型。取值是`mcp`、`cli`、`native`之一。
- `adapter`：安装适配器名称。
- `source`：能力来源。
- `icon`：图标。可为`null`。
- `aliases`：别名列表。
- `auth_methods`：支持的认证方式列表。取值是`none`、`api_key`、`oauth`。
- `contributions`：能力贡献的内容类型列表。取值是`tools`、`skills`。
- `config_schema`：配置项的JSON Schema。默认是`{"type": "object"}`。

响应示例来自源码响应模型推导。

```json
[
  {
    "schema_version": 1,
    "id": "office-tools",
    "version": "1.0.0",
    "name": {"en": "Office Tools", "zh": "办公工具"},
    "description": {"en": "Office document tools", "zh": "办公文档工具"},
    "setup": {"en": "No setup required", "zh": "无需安装"},
    "category": "office",
    "kind": "mcp",
    "adapter": "mcp",
    "source": "builtin",
    "icon": null,
    "aliases": [],
    "auth_methods": ["api_key"],
    "contributions": ["tools"],
    "config_schema": {"type": "object"}
  }
]
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/capabilities/catalog
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/capabilities/catalog
```
