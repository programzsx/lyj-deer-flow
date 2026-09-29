# WechatQRLoginResponse档案

类定义在backend/app/gateway/routers/channel_connections.py。

## 一、这个类是干什么的

这个类是微信扫码登录的响应体。

微信连接用扫码方式。用户用微信扫码。后端轮询扫码状态。

后端用这个类返回扫码会话的状态。这个类是一个Pydantic模型。

## 二、类的成员

这个类有6个字段。

### 1、id

id是扫码会话的编号。这个字段是字符串类型。这个字段必填。

### 2、status

status是扫码状态。

这个字段只有6个合法值。

pending表示等待扫码。scanned表示已扫码。verification_required表示需要验证。confirmed表示已确认。expired表示已过期。failed表示失败。

### 3、qrcode_content

qrcode_content是二维码内容。

这个字段是字符串类型。这个字段必填。

前端用这个内容渲染二维码。

### 4、expires_in

expires_in是会话的有效秒数。这个字段是整数类型。这个字段必填。

### 5、provider

provider是确认后的供应商信息。

这个字段类型是ChannelProviderResponse。默认是None。

### 6、error

error是失败原因。

这个字段只有5个合法值。network表示网络错误。invalid_response表示响应无效。verification_rejected表示验证被拒。verification_blocked表示验证被阻止。already_bound表示已绑定。默认是None。

## 三、它和谁协作

这个类被微信扫码登录路由使用。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

微信扫码是微信连接的唯一方式。这个类承载扫码会话的完整状态。

状态枚举覆盖扫码的全生命周期。

所以评4分。
