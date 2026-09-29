# deerflow.typesafe.connection

## 一、这个模块是干什么的

这个模块解析TypeSafe的有效连接设置。

背景是这样的。

TypeSafe客户端需要连接设置。

设置包括端点、模型、超时、重试、凭据。

设置可以来自多个来源。

多个来源要有明确的优先级。

这个模块就是解析优先级的地方。

优先级是三层的。

第一层是消费方自己的config。

第二层是顶层的typesafe配置块。

第三层是内置默认值。

解析结果是有效配置。

消费方的覆盖项保持独立配置时的行为。

这个模块还定义两种身份。

两种身份绝不能混。

第一种是凭据指纹。

凭据指纹和客户端的sharing_key是内部的。

只有它们能比较凭据。

它们决定两个消费方能不能共享请求。

第二种是公共参数。

公共参数是消费方公开策略身份的连接一半。

它永远不含凭据和凭据指纹。

凭据只存在于这个对象里。

凭据不在repr里。

不在公共参数里。

不在任何错误消息里。

## 二、模块里的主要成员

- TypeSafeConnection：一个消费方的有效连接设置。包含api_key、base_url、model、timeout、deadline_seconds、max_attempts、retry_backoff。
- credential_fingerprint()：凭据指纹。短摘要，用来比较消费方，不记录原钥。
- public_parameters()：公共参数。影响行为的连接设置，给消费方的公开策略身份用。
- url属性：完整的请求端点。
- resolve_connection(...)：核心解析函数。按优先级解析有效连接。
- 缺失和显式None都算"未配置"，落到下一层。显式空值不算，空api_key会被报出来。
- api_key和api_key_env按层解析。某一层设了其中一个，这层就定了凭据。
- resolve_connection_for_mode(...)：按模式解析的变体。
- _resolve_credential：解析凭据。环境变量名也在这一层定。
- _validated_base_url：校验端点。
- credential_text：校验凭据能作为HTTP头发送。不能发送的凭据在这里报配置错误。

## 三、它和谁协作

- 它被typesafe/client消费。客户端从连接构建请求。
- 它被guardrails/typesafe和记忆消费方调用。消费方解析自己的连接。
- 它依赖typesafe/validation做数值校验。

## 四、重要性评级

评级是6分。

理由是它是TypeSafe连接的唯一解析入口。

优先级规则收敛在一个地方。

凭据的安全边界设计很细致。

凭据指纹和公共参数的区分防止凭据泄漏。

所有消费方的连接行为由它统一。

但它本身是解析逻辑，风险中等。
