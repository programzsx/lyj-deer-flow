# app.gateway.authz-档案

源码路径是backend/app/gateway/authz.py。

## 一、这个模块是干什么的

authz.py是授权模块。

授权回答另一个问题。

这个问题是你能做什么。

认证之后是授权。

授权决定用户能访问哪些资源。

这个模块提供装饰器和上下文。

HTTP中间件、装饰器授权、WebSocket准入共用这套授权。

这个模块有1000多行。

## 二、模块里的主要成员

### 1、核心数据结构

Permissions表示权限集合。

AuthContext表示认证上下文。

get_auth_context从请求读认证上下文。

### 2、装饰器

require_auth是认证装饰器。

require_permission是权限装饰器。

require_permission接收资源、动作、过滤键。

owner_check开启归属检查。

require_existing要求资源已存在。

装饰器链从下到上处理。

### 3、权限解析

resolve_route_permissions解析用户的路由权限。

resolve_route_permissions_for_request是请求版包装。

权限提供方有缓存。

授权配置来自AuthorizationConfig。

内部调用者走内部策略。

### 4、资源授权

authorize_model_use检查模型使用授权。

resolve_model_authorization解析模型授权。

resolve_skill_authorization解析技能授权。

技能列表按用户可见目录过滤。

### 5、沙箱准入

authorize_sandbox_for_request检查沙箱请求准入。

SandboxRequestLease是沙箱请求租约。

try_acquire_sandbox_for_request尝试获取租约。

### 6、插件授权

resolve_plugin_authorization解析插件授权。

插件配置有签名缓存。

配置变化时缓存失效。

插件授权不可用默认拒绝。

这保证失败封闭。

## 三、它和谁协作

上游是全部路由和auth_middleware。

路由用require_permission装饰端点。

下游是harness层的授权提供方。

插件授权走deerflow.authz.plugin_authz。

auth_middleware先做认证，authz再做授权。

## 重要性评级

评级是10分。

理由如下。

授权是安全模型的核心。

没有授权，任何登录用户可以做任何事。

多用户数据隔离靠owner检查。

模型、技能、沙箱、插件全部走这套授权。

require_permission装饰器遍布全部路由。

授权不可用时的失败封闭是安全底线。

这是整个权限体系的中心。

所以评级是10分。
