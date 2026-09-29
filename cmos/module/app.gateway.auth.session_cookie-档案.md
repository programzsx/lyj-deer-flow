# app.gateway.auth.session_cookie 档案

## 一、这个模块是干什么的

这个模块负责浏览器会话cookie的策略。

浏览器登录成功后。系统要把JWT令牌放进cookie。cookie要有正确的安全属性。cookie要有正确的生命周期。这个模块负责决定这些属性。

核心问题是持久化。用户勾选了记住我。cookie就要长期保存。cookie的Secure属性要求HTTPS。公网的HTTP环境不能持久化。这个模块在这些条件之间做决策。

这个模块的决策结果有五档。从不持久化、HTTPS持久化、本地HTTP持久化、运维显式允许的HTTP持久化、公网HTTP降级为会话cookie。

## 二、模块里的主要成员

### 1、三个常量

- ACCESS_TOKEN_COOKIE_NAME：值为access_token。这是JWT令牌cookie的名字。
- SESSION_PERSISTENCE_COOKIE_NAME：值为deerflow_session_persistent。这是记住我偏好cookie的名字。
- ALLOW_INSECURE_PERSISTENT_COOKIE_ENV：环境变量名。运维显式允许不安全持久化的开关。

### 2、SessionCookiePolicy数据类

这是一个冻结的dataclass。这个类承载一次决策的结果。

- secure：是否设置Secure属性。
- max_age：cookie寿命。None表示会话cookie，浏览器关闭就失效。
- reason：决策原因。原因字符串便于日志排查。

### 3、_env_flag_enabled函数

这个函数判断环境变量开关是否打开。取值是1、true、yes、on都算打开。

### 4、_request_hostname函数

这个函数返回请求的直接主机名。这个函数不信任转发的Host头。这样伪造的转发头不能骗过本地判断。

### 5、is_local_browser_origin函数

这个函数判断请求是否来自本地浏览器环境。

判断规则如下。主机名是localhost或者以.localhost结尾就算本地。主机名是回环IP地址也算本地。其他都算非本地。

### 6、_remember_me_from_cookie函数

这个函数从偏好cookie读记住我的选择。cookie值是1就是记住。cookie值是0就是不记住。cookie不存在就用默认值。这个小cookie让记住我的选择在重新登录后依然保留。

### 7、resolve_session_cookie_policy函数

这个函数是决策的核心。

决策流程如下。

- 先确定remember。显式传入的remember_me优先。没传就从偏好cookie读。
- 用is_secure_request判断请求是否HTTPS。
- 算出持久化寿命。寿命是token_expiry_days乘86400秒。
- 不记住。返回会话cookie。max_age为None。原因是session_requested。
- 请求是HTTPS。返回持久化cookie。原因是secure_persistent。
- 请求是本地HTTP。返回持久化cookie但Secure为False。原因是localhost_persistent。
- 运维显式设置了允许环境变量。返回不安全的持久化cookie。原因是operator_insecure_persistent。
- 其余情况。公网HTTP。降级为会话cookie。原因是public_http_session。

### 8、set_session_cookie函数

这个函数负责实际设置cookie。

处理流程如下。

- 先解析remember。
- 调resolve_session_cookie_policy拿到策略。
- 设置access_token cookie。属性是HttpOnly加Secure加samesite lax。max_age来自策略。
- 设置偏好cookie。值为1或0。属性和access_token一致。
- 把决策结果盖章到request.state上。盖三个章。max_age、secure、issued标记。
- 打debug日志。
- 返回策略。

### 9、request.state盖章的用途

CSRF cookie的创建会读这些章。创建会话的响应会盖max_age章。CSRF cookie要和access_token cookie同时过期。两边读同一个章就能保持一致。改密码后重新发cookie时也一样。

## 三、它和谁协作

### 1、它依赖谁

- app.gateway.auth.config.get_auth_config：提供token_expiry_days。
- app.gateway.auth.session_cookie_state：提供request.state的章的键名。
- app.gateway.csrf_middleware.is_secure_request：判断请求是否HTTPS。

### 2、谁调用它

登录端点、改密码端点、OIDC回调端点都会创建会话。这些端点调set_session_cookie。登出端点清cookie。CSRF中间件读request.state上的章。

## 四、重要性评级

评级是8分。

理由如下。

浏览器会话的建立都经过这个模块。每个登录用户都受这个策略保护。

安全决策的档位划分很细。公网HTTP不能持久化。这是防止令牌明文传输后被长期持有。本地HTTP可以持久化。这是保留本地开发的便利。运维显式开关是逃生门。这些决策都集中在一个函数里。

request.state盖章机制保证了CSRF cookie和会话cookie的生命周期一致。不一致会导致CSRF保护失效。

这个模块是登录链路的核心。但JWT本身的签发和校验不在这里。所以评级是8分。
