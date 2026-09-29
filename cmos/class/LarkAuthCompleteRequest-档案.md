# LarkAuthCompleteRequest档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是完成Lark用户授权的请求体。

用户在浏览器批准授权后。前端用设备码轮询授权结果。

前端调用POST /api/integrations/lark/auth/complete接口。后端用这个类接收轮询参数。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、device_code

device_code是授权启动时返回的设备码。

这个字段是字符串类型。这个字段必填。

### 2、generation

generation是授权启动时返回的服务端代数。

这个字段是字符串类型。这个字段必填。最短1个字符。最长64个字符。

过期的完成请求返回409。

### 3、wait_timeout_seconds

wait_timeout_seconds是本次设备码轮询的最长等待秒数。

这个字段是整数类型。默认值是LARK_AUTH_COMPLETE_DEFAULT_WAIT_SECONDS。有最小和最大限制。

前端自动轮询用较短的等待。

## 三、它和谁协作

这个类被POST /api/integrations/lark/auth/complete路由使用。

完成由complete_lark_auth函数处理。完成后令牌被清空和吊销的事务与凭证切换一致。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是授权完成流程的收尾参数。generation字段防止旧流程误完成。

这个类只是流程参数的载体。

所以评3分。
