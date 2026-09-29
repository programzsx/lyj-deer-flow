# _OAuthToken档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.oauth`模块的内部辅助类。

类名以下划线开头。这个命名说明这个类是内部实现细节。外部代码不应该直接使用这个类。

这个类的作用是承载一个缓存的OAuth令牌。

背景是这样的。

DeerFlow的MCP服务器可以用HTTP或SSE传输。

这类传输需要OAuth认证。

`OAuthTokenManager`向令牌端点请求令牌。

请求回来的令牌被缓存在内存里。

`_OAuthToken`就是那个缓存条目的数据结构。

模块docstring写的是"OAuth token support for MCP HTTP/SSE servers"。意思是这个模块为MCP的HTTP和SSE服务器提供OAuth令牌支持。这个类是这个支持体系的存储单元。

## 二、类的成员

### 1、字段

这个类是dataclass。

- `access_token`：字符串字段。这个字段存放访问令牌本身。
- `token_type`：字符串字段。这个字段存放令牌类型，通常是`"Bearer"`。
- `expires_at`：`datetime`字段。这个字段记录令牌的过期时刻。时区是UTC。

### 2、行为

这个类是纯数据类。这个类没有定义业务方法。

消费逻辑在`OAuthTokenManager`里。

`_is_expiring`方法读取`expires_at`字段。当前时间加上刷新提前量超过了过期时刻，令牌就被判定为快过期。快过期的令牌会被重新获取。

`_authorization_value`方法读取`access_token`和`token_type`字段。这两个字段被渲染成`"<token_type> <access_token>"`形式的Authorization头。

## 三、它和谁协作

这个类和以下对象协作。

- `OAuthTokenManager`：这个类的唯一使用方。`_tokens`字典的值就是这个类。`_fetch_token`构造这个类。`_is_expiring`和`_authorization_value`读取这个类。
- `McpOAuthConfig`：配置类。`_fetch_token`用这个配置类里的字段名读取令牌响应，然后构造`_OAuthToken`。
- HTTP工具拦截器：拦截器通过`OAuthTokenManager`间接使用令牌，把令牌注入到MCP请求头里。

## 四、重要性评级

评级：4分。

理由如下。

这个类是OAuth令牌缓存的存储单元。没有这个类，令牌的过期时刻就没有地方放。没有过期时刻就没有自动刷新。自动刷新是长连接场景的必需能力。

但是这个类非常小。这个类只有三个字段。这个类没有任何业务方法。全部逻辑都在`OAuthTokenManager`里。

这个类是内部实现细节。外部代码不直接引用这个类。如果删掉这个类，可以用一个元组或字典代替，代价是可读性下降。

所以这个类给4分。这个类必要但体量很小。
