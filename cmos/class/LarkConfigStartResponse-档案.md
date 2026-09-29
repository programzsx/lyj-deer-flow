# LarkConfigStartResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是启动Lark首次配置的响应体。

配置启动后。后端用这个类返回配置入口信息。用户打开验证地址配置应用。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有7个字段。

### 1、verification_url

verification_url是用户要在浏览器打开的配置地址。

这个字段是字符串类型。这个字段必填。

### 2、device_code

device_code是配置完成后用的设备码。

这个字段是字符串类型。这个字段必填。

### 3、generation

generation是绑定本次配置流程的服务端代数。

这个字段是字符串类型。这个字段必填。

### 4、expires_in

expires_in是配置地址的有效秒数。这个字段是整数类型。默认是None。

### 5、interval

interval是Lark建议的轮询间隔。这个字段是整数类型。默认是None。

### 6、user_code

user_code是Lark显示的可选用户码。这个字段是字符串类型。默认是None。

### 7、brand

brand是本次注册应用使用的品牌。这个字段是字符串类型。这个字段必填。

## 三、它和谁协作

这个类被POST /api/integrations/lark/config/start路由使用。

这个类和LarkConfigCompleteRequest配对。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是配置流程的起点数据。generation字段绑定流程代数。

这个类只是流程数据的载体。

所以评3分。
