# app.gateway.csrf_middleware-档案

源码路径是backend/app/gateway/csrf_middleware.py。

## 一、这个模块是干什么的

csrf_middleware.py是CSRF保护中间件。

CSRF是跨站请求伪造攻击。

攻击者让浏览器替用户发恶意请求。

状态变更操作必须做CSRF保护。

这个模块按RFC-001实现保护。

这个模块有287行。

## 二、模块里的主要成员

### 1、CSRFMiddleware

CSRFMiddleware是中间件类。

中间件拦截每个状态变更请求。

状态变更是POST、PUT、DELETE、PATCH。

GET请求不做CSRF检查。

### 2、令牌机制

generate_csrf_token生成随机令牌。

令牌存进cookie。

请求头携带同一个令牌。

两头匹配才放行。

get_csrf_token读取请求里的令牌。

### 3、豁免逻辑

should_check_csrf判断是否检查。

is_auth_endpoint判断是否认证端点。

认证端点有单独的Origin检查。

webhook路径豁免CSRF。

GitHub发不了CSRF令牌。

### 4、Origin校验

is_allowed_auth_origin校验认证端点的Origin。

_request_origin解析请求Origin。

_normalize_origin规范化Origin。

_configured_cors_origins读取配置的CORS来源。

_forwarded_param处理代理转发头。

### 5、cookie设置

auth_csrf_cookie_settings计算cookie参数。

参数包括secure和max-age。

is_secure_request判断HTTPS。

## 三、它和谁协作

上游是app.py注册的中间件链。

依赖app.gateway.auth的会话cookie状态。

下游是全部状态变更端点。

webhook路由被豁免。

## 重要性评级

评级是9分。

理由如下。

CSRF保护是Web安全的基础。

会话cookie认证必须有CSRF防护。

没有它，攻击者可以伪造用户操作。

改密码、删数据都能被伪造。

Origin校验是认证端点的额外防线。

豁免逻辑控制得当，webhook不受影响。

它是安全模型的必备一环。

所以评级是9分。
