# LarkConfigCompleteResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是完成Lark首次配置的响应体。

配置完成后。后端用这个类返回结果和完整集成状态。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、success

success表示配置是否成功。这个字段是布尔类型。这个字段必填。

### 2、message

message是结果说明。这个字段是字符串类型。这个字段必填。

### 3、generation

generation是配置完成后的最新流程代数。这个字段是字符串类型。这个字段必填。

### 4、status

status是配置后的完整集成状态。

这个字段类型是LarkIntegrationStatusResponse。这个字段必填。

## 三、它和谁协作

这个类被POST /api/integrations/lark/config/complete路由使用。

status字段由LarkIntegrationStatusResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是配置结果的容器。generation字段让前端跟踪最新代数。

所以评3分。
