# app.gateway.auth_middleware-档案

源码路径是backend/app/gateway/auth_middleware.py。

## 一、这个模块是干什么的

auth_middleware.py是全局认证中间件。

中间件是安全兜底。

未认证的请求访问非公开路径，返回401。

认证通过后，中间件把用户对象挂到请求上。

后续的仓库层自动按用户过滤数据。

细粒度权限检查留在authz.py装饰器里。

这个模块有199行。

## 二、模块里的主要成员

### 1、AuthMiddleware

AuthMiddleware是中间件类。

中间件拦截每个HTTP请求。

中间件先检查路径是否公开。

### 2、公开路径

_PUBLIC_PATH_PREFIXES是公开路径前缀。

公开前缀包括健康检查和webhook。

_PUBLIC_EXACT_PATHS是公开的精确路径。

_is_public判断一个路径是否公开。

webhook豁免定义在这里。

### 3、认证流程

请求带会话cookie时，中间件解析JWT。

JWT解析成真实的User对象。

User挂到request.state.user。

User同时写进user_context的contextvar。

sentinel模式让仓库层自动做owner过滤。

### 4、失败处理

认证失败返回401。

错误码来自app.gateway.auth.errors。

错误响应是AuthErrorResponse。

## 三、它和谁协作

上游是app.py注册的中间件链。

依赖app.gateway.auth子包的JWT解析。

下游是全部路由。

路由里的user对象来自这个中间件。

仓库层的owner过滤依赖contextvar。

## 重要性评级

评级是10分。

理由如下。

认证中间件是安全的第一道兜底。

没有它，未认证请求会直达路由。

数据隔离会完全失效。

所有路由的认证都经过这里。

仓库层的自动owner过滤依赖这个中间件。

认证错误处理也在这一层。

它是安全模型的根基。

所以评级是10分。
