# CSRFMiddleware档案

来源文件：`backend/app/gateway/csrf_middleware.py`

## 一、这个类是干什么的

这个类是CSRF防护中间件。

CSRF是跨站请求伪造攻击。

防护原理是RFC-001规定的状态变更操作需要CSRF令牌。

这个类实现的是Double Submit Cookie模式。

模式的做法分两端。

服务端往浏览器种一个`csrf_token`cookie。

浏览器发起状态变更请求时把同一个令牌放在`X-CSRF-Token`头里。

服务端比对cookie和头里的令牌。一致才放行。

这个类还有一个附加职责。

这个类对认证端点做跨站Origin检查。

登录注册这类端点在首次调用时没有CSRF令牌，所以不走令牌比对。

但这类端点会创建会话cookie。

带着恶意Origin头的浏览器请求必须被拒绝，防止登录CSRF和会话固定攻击。

## 二、类的成员

这个类继承自Starlette的`BaseHTTPMiddleware`。

中间件类的核心是钩子方法`dispatch`。

### 1、方法dispatch

`dispatch`是每个HTTP请求的钩子。

`dispatch`的流程分三段。

第一段是跨站Origin检查。认证端点的POST请求如果Origin可疑，直接403拒绝。

第二段是CSRF令牌比对。非认证端点的POST、PUT、DELETE、PATCH请求，如果没带`authorization`头，就必须带齐cookie令牌和头令牌。缺一个就403。令牌不一致也403。Bearer请求跳过令牌比对，安全靠`AuthMiddleware`的Bearer优先级兜底。

第三段是种CSRF cookie。认证端点的POST成功后，`dispatch`生成新令牌种进响应。cookie的生命周期镜像会话cookie的max_age，让双提交对永不分叉。

### 2、模块级函数is_allowed_auth_origin

`is_allowed_auth_origin`判断认证请求的Origin是否允许。

无Origin头的请求放行，这服务curl和移动集成这类非浏览器客户端。

有Origin头就归一化后比对。

比对对象是配置的`GATEWAY_CORS_ORIGINS`和请求自身Origin。

### 3、模块级函数should_check_csrf

`should_check_csrf`判断请求是否需要CSRF校验。

只有POST、PUT、DELETE、PATCH需要校验。

GET等安全方法豁免。

webhook路径豁免，webhook靠HMAC签名自证。

### 4、模块级常量CORS_EXPOSED_HEADERS

`CORS_EXPOSED_HEADERS`声明分源浏览器客户端必须能读的响应头。

包括`Content-Location`和`X-Trace-Id`。

`Content-Location`承载新建run的id。LangGraph SDK从这一个头解析run元数据。不给就断了前端`useStream`的`onCreated`。

### 5、模块级函数get_configured_cors_origins

`get_configured_cors_origins`返回归一化后的显式浏览器Origin集合。

来源是环境变量`GATEWAY_CORS_ORIGINS`。

## 三、它和谁协作

这个类在Gateway的ASGI中间件栈里。

这个类和`AuthMiddleware`形成安全配合。

`AuthMiddleware`的严格Bearer优先级让这个类的Bearer跳过是安全的。

这个类依赖`auth/session_cookie_state.py`的状态标记。

会话处理器在`request.state`上盖的max_age和secure标记会被这个类镜像到CSRF cookie。

这个类依赖`auth/config.py`的认证配置计算cookie生命周期。

这个类的`is_secure_request()`被`session_cookie.py`复用。

这个类的`get_configured_cors_origins()`也供CORS层读取，让浏览器CORS和认证Origin检查保持一致。

## 四、重要性评级

评级：9分。

理由：这个类是Gateway的CSRF防线。所有状态变更请求的跨站防护都靠这个类。这个类的Origin检查保护登录CSRF和会话固定。这个类的令牌生命周期镜像设计防止了CSRF cookie和会话cookie分叉。这个类还承担CORS暴露头的职责，断了它前端就拿不到run id。所以这个类是核心安全组件。
