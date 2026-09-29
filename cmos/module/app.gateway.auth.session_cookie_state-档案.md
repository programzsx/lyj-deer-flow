# app.gateway.auth.session_cookie_state 档案

## 一、这个模块是干什么的

这个模块定义请求状态键的常量。

会话cookie的处理和CSRF cookie的处理是两处代码。这两处代码要共享决策结果。共享的方式是request.state上的属性。

属性名如果两边各写各的字符串。写错一个字母就静默失效。这个模块把属性名定义成常量。两处代码引用同一组常量。名字永远一致。

## 二、模块里的主要成员

这个模块只有四个字符串常量。

- SESSION_COOKIE_ISSUED_STATE_ATTR：值为deerflow_session_cookie_issued。这个键标记本次请求是否发过会话cookie。
- SESSION_COOKIE_MAX_AGE_STATE_ATTR：值为deerflow_session_cookie_max_age。这个键承载cookie的max_age。CSRF cookie创建时读这个键，保证CSRF cookie和会话cookie同时过期。
- SESSION_COOKIE_SECURE_STATE_ATTR：值为deerflow_session_cookie_secure。这个键承载cookie的Secure决策。
- SKIP_AUTH_CSRF_COOKIE_STATE_ATTR：值为deerflow_skip_auth_csrf_cookie。这个键标记跳过认证CSRF cookie的补发。登出响应用这个键抑制CSRF cookie的重新发放。

## 三、它和谁协作

### 1、它依赖谁

这个模块不依赖任何模块。这个模块是纯常量定义。

### 2、谁调用它

session_cookie模块读写前三个键。CSRF中间件读写这些键。登出逻辑用SKIP_AUTH_CSRF_COOKIE_STATE_ATTR抑制CSRF补发。

## 四、重要性评级

评级是2分。

理由如下。

这个模块只有四个常量。没有逻辑。代码量极小。

这些常量是跨模块的键名契约。键名不一致会导致cookie生命周期不同步。这种失效是静默的。所以集中定义有防御价值。

但是这些常量本身简单。改动频率低。作用范围限于cookie处理。所以评级是2分。
