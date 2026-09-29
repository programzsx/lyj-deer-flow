# deerflow.config.pii_redaction_config-档案

## 一、这个模块是干什么的

这个模块管理PII脱敏中间件的配置。

PII是个人身份信息。

比如邮箱、电话、身份证、信用卡。

开启后，真实用户消息和远程内容里的PII会被改写。

改写成带密钥的占位符。

占位符基于128位HMAC摘要。

PII到不了模型。

问题编号是issue #3190。

默认关闭。

## 二、模块里的主要成员

### 1、PiiRedactionConfig类

`enabled`是开关，默认关闭。

五类PII各自可以独立开关。

`redact_email`脱敏邮箱地址。

`redact_api_key`脱敏API密钥和bearer令牌。

覆盖OpenAI的sk-前缀、AWS的AKIA、GitHub的ghp_等。

`redact_credit_card`脱敏通过Luhn校验的信用卡号。

`redact_phone`脱敏电话号码。

覆盖国际格式、中国手机、美国格式。

`redact_national_id`脱敏身份证号。

覆盖中国居民身份证、巴西CPF、阿根廷CUIT等。

`token_secret`是部署范围的HMAC密钥。

### 2、token_secret的强制校验

开启脱敏时token_secret必填。

必须非空且至少16字符。

短密钥会让带密钥的摘要被离线暴力破解。

比如低熵的电话号码。

没有密钥的摘要就是公开可算的全局指纹。

跨部署可关联，正好破坏脱敏要保护的重识别保证。

校验器把这类错误在配置加载时就挡住。

## 三、它和谁协作

`app_config.py`的`pii_redaction`字段是这份配置。

PII脱敏中间件消费这份配置。

中间件在模型绑定的上下文里做改写。

## 四、重要性评级

评级：6分。

理由：PII脱敏是合规部署的关键能力。token_secret的强制校验堵住一个真实的安全坑。默认关闭加上独立开关的设计让部署可以按需启用。
