# SessionCookiePolicy档案

来源文件：`backend/app/gateway/auth/session_cookie.py`

## 一、这个类是干什么的

这个类是浏览器会话cookie的策略快照。

浏览器登录会创建`access_token`cookie。

这个cookie的生命周期和安全属性由部署环境决定。

这个类就是那个"最终决定"的载体。

这个类是冻结dataclass，三个字段。

`secure`表示cookie是否只在HTTPS下传输。

`max_age`是cookie生命周期秒数，`None`表示会话级cookie。

`reason`是决策原因的说明字符串。

决策逻辑在模块级函数`resolve_session_cookie_policy()`里。

决策按五步展开。

第一步看用户意图。用户选了"记住我"就想持久化，没选就是会话级。

第二步HTTPS环境下持久化是安全的，直接给持久cookie。

第三步本地localhost的HTTP环境可以接受不安全的持久cookie。

第四步运维可以显式打开不安全持久化开关。

第五步公共HTTP沙箱URL降级为会话cookie。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的冻结数据类。

这个类有三个字段。

### 1、字段secure

`secure`是布尔值。

`secure`为真时cookie只在HTTPS下传输。

### 2、字段max_age

`max_age`是cookie生命周期秒数。

`None`表示会话级cookie，浏览器关闭就失效。

持久cookie的生命周期来自认证配置的令牌过期天数。

### 3、字段reason

`reason`是决策原因字符串。

取值有`session_requested`、`secure_persistent`、`localhost_persistent`、`operator_insecure_persistent`、`public_http_session`。

### 4、模块级函数resolve_session_cookie_policy

`resolve_session_cookie_policy()`创建这个类。

这个函数执行上面说的五步决策。

### 5、模块级函数set_session_cookie

`set_session_cookie()`种cookie并盖状态标记。

`set_session_cookie()`种两个cookie。

一个是HttpOnly的`access_token`。

一个是HttpOnly的偏好cookie，记住用户的"记住我"选择。

`set_session_cookie()`把最终的max_age和secure盖到`request.state`上。

CSRF中间件镜像这些标记，让双提交cookie对一起过期。

### 6、模块级函数is_local_browser_origin

`is_local_browser_origin()`判断是否是本地回环浏览器Origin。

localhost和回环IP都算。

本地持久化刻意读取直连请求的Host，忽略转发头。

## 三、它和谁协作

这个类由`resolve_session_cookie_policy()`创建。

这个类被`set_session_cookie()`消费。

`set_session_cookie()`被登录路由和OIDC回调路由使用。

这个类的max_age和secure标记被CSRF中间件镜像。

这个类依赖`csrf_middleware.py`的`is_secure_request()`判断HTTPS。

这个类依赖`auth/config.py`的令牌过期配置。

## 四、重要性评级

评级：7分。

理由：这个类是浏览器认证会话的核心策略。整个Gateway的登录态生命周期由这个类决定。这个类的五步决策把HTTPS、localhost、运维开关、公共沙箱四种部署形态都覆盖了。会话处理器在这里盖的状态标记还被CSRF cookie复用，让双提交对一起过期。所以这个类是认证体系里承重的策略组件。
