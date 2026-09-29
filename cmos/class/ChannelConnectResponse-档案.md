# ChannelConnectResponse档案

类定义在backend/app/gateway/routers/channel_connections.py。

## 一、这个类是干什么的

这个类是发起IM渠道连接的响应体。

用户想把IM账号连接到DeerFlow。发起连接后后端返回绑定方式。

不同的供应商有不同的授权模式。深度链接或绑定码。这个类描述绑定方式。这个类是一个Pydantic模型。

## 二、类的成员

这个类有6个字段。

### 1、provider

provider是供应商标识。这个字段是字符串类型。这个字段必填。

### 2、mode

mode是授权模式。

这个字段是字符串类型。这个字段必填。

deep_link表示深度链接。binding_code表示绑定码。

### 3、url

url是深度链接地址。

这个字段是字符串类型。默认是None。

深度链接模式时返回这个地址。

### 4、code

code是绑定码。

这个字段是字符串类型。这个字段必填。

用户把绑定码发给IM里的机器人。完成绑定。

### 5、instruction

instruction是给用户的操作指引。这个字段是字符串类型。这个字段必填。

### 6、expires_in

expires_in是绑定码的有效秒数。这个字段是整数类型。这个字段必填。

## 三、它和谁协作

这个类被渠道连接发起路由使用。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

发起连接是IM绑定的入口。这个类描述用户怎么完成绑定。

code和instruction字段引导用户操作。

所以评4分。
