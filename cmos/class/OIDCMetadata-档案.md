# OIDCMetadata档案

源文件：`backend/app/gateway/auth/oidc.py`

## 一、这个类是干什么的

OIDCMetadata是OIDC提供方发现结果的元数据。

OIDCMetadata是冻结的dataclass。

OIDCMetadata保存提供方的各个端点地址。

OIDCService的`discover`方法获取发现文档后，把结果整理成这个对象。

后续所有OIDC操作都从这个对象拿端点地址。

## （一）"发现"是什么

OIDC提供方会公布一个发现文档。

发现文档的地址固定是`/.well-known/openid-configuration`。

客户端不需要手工配置端点。

客户端去发现文档里读取端点地址。

读取到的端点地址就存在这个类里。

## 二、类的成员

### 1、字段

- `issuer`：提供方的issuer标识。发现文档的issuer必须与配置的issuer一致。
- `authorization_endpoint`：授权端点地址。浏览器会被重定向到这里。
- `token_endpoint`：令牌端点地址。授权码在这里换取令牌。
- `userinfo_endpoint`：userinfo端点地址。可选。有些提供方不提供。
- `jwks_uri`：JWKS公钥集的地址。ID令牌的签名在这里验证。

### 2、方法

这个类没有自定义方法。

dataclass自动生成基本方法。

frozen配置让实例不可变。

## （二）issuer一致性的意义

`discover`方法会校验发现文档的issuer。

校验规则是RFC 8414第4节的规定。

发现文档的issuer必须等于配置的issuer。

不校验的后果很严重。
>
被篡改的发现文档可以把可接受的iss指向攻击者选择的值。
>
这会扩大ID令牌伪造的攻击面。

所以校验是安全必需的。

## 三、它和谁协作

OIDCService的`discover`方法构造这个对象。

`build_authorization_url`从它读`authorization_endpoint`。

`exchange_code`从它读`token_endpoint`。

`validate_id_token`从它读`jwks_uri`和`issuer`。

`fetch_userinfo`从它读`userinfo_endpoint`。

元数据在OIDCService内部按issuer缓存5分钟。

## 四、重要性评级

评级：4分。

理由：这个类是所有OIDC操作的路标。没有它，每个操作都不知道该请求哪个端点。issuer校验是防伪造的关键一环，但校验逻辑在OIDCService里，不在这个类里。它本身是纯数据容器，不可变，逻辑为零。
