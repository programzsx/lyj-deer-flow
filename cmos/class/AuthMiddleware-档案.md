# AuthMiddleware档案

来源文件：`backend/app/gateway/auth_middleware.py`

## 一、这个类是干什么的

这个类是全局认证中间件。

这个类是整个Gateway的严格认证大门。

这个类的核心原则是fail-closed。

没有有效凭证的请求一律401拒绝。

非公开路径都必须过这道门。

这道门支持四种凭证来源。

第一种是内部信任头，供IM通道worker使用。

第二种是Bearer令牌，也就是个人访问令牌PAT。

第三种是会话cookie，也就是浏览器登录态。

第四种是认证禁用模式，这是运维覆盖，仅用于无认证的沙箱环境。

认证通过后，这个类做两件关键事。

第一件是把解析出来的`User`对象盖到`request.state.user`上。

第二件是把用户盖到`user_context`上下文变量里。

上下文变量让仓库层的owner过滤自动生效，路由不用逐个写装饰器。

细粒度权限检查不在这个类里做。细粒度检查在`authz.py`里做。

## 二、类的成员

这个类继承自Starlette的`BaseHTTPMiddleware`。

中间件类的核心是钩子方法`dispatch`。

### 1、方法dispatch

`dispatch`是每个HTTP请求的入口钩子。

`dispatch`的流程分五步。

第一步判断路径是否公开。公开路径直接放行。公开路径包括健康检查、文档、OAuth回调、webhook。

第二步检查内部信任头。有效的内部令牌会解析出携带真实owner身份的合成内部用户。owner身份让每用户文件路径解析到IM通道用户。

第三步按优先级解析凭证。Bearer的优先级高于cookie。这里有个关键安全设计。存在但无效的Bearer是硬401，绝不静默回退到cookie。这个设计同时保护了CSRF中间件的Bearer跳过逻辑。跨站攻击者不能靠塞一个垃圾Bearer头骑受害者的cookie。

第四步处理Bearer的路由边界。PAT的作用域只约束带装饰器的路由。不在显式PAT策略内的路由对PAT调用方一律403关闭。全作用域令牌也不能到达无装饰器的变更路由。

第五步解析会话cookie。这里调用严格版JWT解析。垃圾令牌、过期令牌都在这里401。精细的错误码会传播，不会压扁成一个通用码。

### 2、权限解析与上下文盖戳

凭证解析成功后，`dispatch`做四件事。

第一件是把`user`盖到`request.state.user`。

第二件是把认证来源盖到`request.state.auth_source`。

第三件是调用`resolve_route_permissions()`解析路由权限，盖到`request.state.auth`。PAT的权限只做收窄，用作用域求交集，绝不放大。

第四件是把用户盖进`user_context`上下文变量，请求结束后在`finally`里重置。

## 三、它和谁协作

这个类在Gateway的ASGI中间件栈里，位于所有路由之前。

这个类上游是TraceMiddleware。

这个类依赖`authz.py`的`resolve_route_permissions()`解析权限。

这个类依赖`deps.py`的`get_current_user_from_request()`做JWT到用户的解析。

这个类依赖`internal_auth.py`识别内部调用方。

这个类依赖`auth_disabled.py`处理认证禁用模式。

这个类的产出被下游三样东西消费。

`request.state.auth`被`@require_permission`装饰器消费。

`request.state.user`被各路由消费。

`user_context`上下文变量被仓库层的owner过滤消费。

## 四、重要性评级

评级：10分。

理由：这个类是整个Gateway的认证第一道门。所有API安全都建立在这个类之上。这个类的Bearer优先级设计同时保护了认证和CSRF两层。这个类失败意味着整个系统的owner隔离失效。这个类是全系统最关键的安全组件之一。
