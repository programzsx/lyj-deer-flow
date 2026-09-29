# LarkAuthStartResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是启动Lark用户授权的响应体。

授权启动后。后端用这个类返回授权入口信息。用户打开验证地址。批准后前端用设备码完成授权。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有6个字段。

### 1、verification_url

verification_url是用户要在浏览器打开的授权地址。

这个字段是字符串类型。这个字段必填。

### 2、device_code

device_code是完成授权用的设备码。

这个字段是字符串类型。这个字段必填。

前端轮询授权结果时带这个码。

### 3、generation

generation是绑定本次授权流程的服务端代数。

这个字段是字符串类型。这个字段必填。

完成授权时必须带这个代数。

### 4、expires_in

expires_in是授权地址的有效秒数。这个字段是整数类型。默认是None。

### 5、user_code

user_code是Lark显示的可选用户码。这个字段是字符串类型。默认是None。

### 6、hint

hint是lark-cli返回的可选提示。这个字段是字符串类型。默认是None。

## 三、它和谁协作

这个类被POST /api/integrations/lark/auth/start路由使用。

这个类和LarkAuthCompleteRequest配对。启动返回设备码和代数。完成时用它们轮询结果。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是设备码授权流程的起点数据。generation字段支持并发保护。

这个类只是流程数据的载体。

所以评3分。
