# ChannelProviderResponse档案

类定义在backend/app/gateway/routers/channel_connections.py。

## 一、这个类是干什么的

这个类是单个IM渠道供应商的响应体。

DeerFlow支持多个IM平台。Telegram、Slack、Discord、飞书、钉钉、微信。每个平台是一个供应商。

前端调用渠道接口查看每个供应商的状态。后端用这个类描述每个供应商。这个类是一个Pydantic模型。

## 二、类的成员

这个类有10个字段。

### 1、provider

provider是供应商标识。例如telegram。这个字段是字符串类型。这个字段必填。

### 2、display_name

display_name是显示名称。例如Telegram。这个字段是字符串类型。这个字段必填。

### 3、enabled

enabled表示渠道功能是否开启。这个字段是布尔类型。这个字段必填。

### 4、configured

configured表示供应商是否已配置凭证。这个字段是布尔类型。这个字段必填。

### 5、connectable

connectable表示是否可以连接。这个字段是布尔类型。这个字段必填。

### 6、unavailable_reason

unavailable_reason是不可连接的原因。这个字段是字符串类型。默认是None。

### 7、auth_mode

auth_mode是授权模式。

这个字段是字符串类型。这个字段必填。

deep_link表示深度链接。binding_code表示绑定码。

### 8、connection_status

connection_status是连接状态。这个字段是字符串类型。这个字段必填。

### 9、credential_fields

credential_fields是凭证字段描述列表。

这个字段类型是ChannelCredentialFieldResponse列表。默认是空列表。

### 10、credential_values

credential_values是已保存的凭证值。

这个字段是字典类型。默认是空字典。

## 三、它和谁协作

这个类被渠道供应商查询路由使用。

这个类作为ChannelProvidersResponse的providers字段元素类型。也作为WechatQRLoginResponse的provider字段。

字段元数据来自_PROVIDER_META和_CREDENTIAL_FIELDS常量。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

IM渠道连接是外部接入的核心。这个类是供应商状态的完整视图。

credential_fields驱动前端渲染凭证表单。

所以评4分。
