# LarkAuthCompleteResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是完成Lark用户授权的响应体。

授权完成后。后端用这个类返回结果和完整集成状态。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、success

success表示授权是否成功。这个字段是布尔类型。这个字段必填。

### 2、message

message是结果说明。这个字段是字符串类型。这个字段必填。

### 3、status

status是授权后的完整集成状态。

这个字段类型是LarkIntegrationStatusResponse。这个字段必填。

## 三、它和谁协作

这个类被POST /api/integrations/lark/auth/complete路由使用。

status字段由LarkIntegrationStatusResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是授权结果的容器。实际状态在LarkIntegrationStatusResponse里。

所以评3分。
