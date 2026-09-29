# LarkConfigCredentialsRequest档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是切换Lark应用凭证的请求体。

用户想把自己的Lark集成切换到另一个应用。用户要提供新应用的编号和密钥。

前端调用POST /api/integrations/lark/config/credentials接口。后端用这个类接收凭证。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、app_id

app_id是要切换到的Lark应用编号。

这个字段是字符串类型。这个字段必填。

### 2、app_secret

app_secret是配对的Lark应用密钥。

这个字段是字符串类型。这个字段必填。

密钥切换前会通过官方CLI的实时租户令牌探测验证。验证不过不切换。

### 3、brand

brand是Lark品牌。

这个字段只有2个合法值。feishu和lark。默认是feishu。

## 三、它和谁协作

这个类被POST /api/integrations/lark/config/credentials路由使用。

切换由set_lark_app_credentials函数处理。切换是原子操作。验证新凭证。吊销旧的OAuth令牌。切换失败时恢复原来的凭证树。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

凭证切换是Lark集成的敏感操作。这个类承载应用密钥。

原子切换设计保证失败时不丢凭证。实时探测保证凭证有效。

所以评4分。
