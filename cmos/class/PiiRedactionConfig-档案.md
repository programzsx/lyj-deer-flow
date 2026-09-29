# PiiRedactionConfig档案

一、这个类是干什么的

PiiRedactionConfig是PII脱敏中间件的配置类。对应issue #3190。默认关闭。启用后用户消息和远程内容工具结果里的个人信息会被改写成占位符。占位符是带密钥的、由值推导的HMAC摘要。改写发生在内容到达模型之前。每个探测器可以独立开关。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否在模型可见的上下文里启用PII脱敏。
- redact_email：布尔值。默认值是True。这个字段控制邮箱地址要不要脱敏。
- redact_api_key：布尔值。默认值是True。这个字段控制API密钥和bearer令牌要不要脱敏。覆盖OpenAI的sk-、AWS的AKIA、GitHub的ghp_等格式。
- redact_credit_card：布尔值。默认值是True。这个字段控制通过Luhn校验的信用卡号要不要脱敏。
- redact_phone：布尔值。默认值是True。这个字段控制电话号码要不要脱敏。覆盖国际格式、中国手机号和美国格式。
- redact_national_id：布尔值。默认值是True。这个字段控制身份证件号要不要脱敏。覆盖中国居民身份证、CPF、CUIT和RFC。
- token_secret：字符串或None。默认值是None。这个字段是部署级密钥。这个密钥是占位符摘要的HMAC密钥。启用时必须提供非空且至少16字符的值。令牌只在同一部署内可关联。没有密钥就无法离线反推原始值。

（二）方法

- _token_secret_required_when_enabled：模型校验器。这个方法拒绝在没有可用密钥时启用脱敏。启用时token_secret必须非空且至少16字符。没有密钥的摘要是公开可算的指纹。这样的指纹可以跨部署关联。这正好破坏脱敏要保护的反识别保证。

三、它和谁协作

AppConfig持有这个类。AppConfig的pii_redaction字段是这个类的实例。PII脱敏中间件读取这个实例。模块级常量MIN_TOKEN_SECRET_LENGTH为16提供最小长度。

四、重要性评级

评级：7分。

理由：这个类处理个人隐私数据。校验器强制要求密钥。配置错误会导致脱敏失效或指纹泄露。安全相关且默认有保护。所以重要性中上。
