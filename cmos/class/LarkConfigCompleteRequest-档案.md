# LarkConfigCompleteRequest档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是完成Lark首次配置的请求体。

用户在浏览器配置完应用后。前端用设备码轮询配置结果。

前端调用POST /api/integrations/lark/config/complete接口。后端用这个类接收轮询参数。这个类是一个Pydantic模型。

## 二、类的成员

这个类有5个字段。

### 1、device_code

device_code是配置启动时返回的设备码。这个字段是字符串类型。这个字段必填。

### 2、generation

generation是配置启动时返回的服务端代数。

这个字段是字符串类型。这个字段必填。最短1个字符。最长64个字符。

过期的完成请求返回409。

### 3、brand

brand是配置启动时返回的品牌。这个字段是字符串类型。默认是feishu。

### 4、interval

interval是轮询间隔。这个字段是整数类型。默认是None。

### 5、expires_in

expires_in是有效期。这个字段是整数类型。默认是None。

## 三、它和谁协作

这个类被POST /api/integrations/lark/config/complete路由使用。

完成由complete_lark_config函数处理。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是2分。

理由如下。

这个类是配置完成流程的参数载体。generation字段防止旧流程误完成。

字段大多是回传参数。

所以评2分。
