# LarkAuthProbeResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是Lark授权状态探测的响应体。

Lark集成需要用户授权。系统想知道当前用户是否已授权。授权状态是否可靠。

后端探测后用这个类返回授权状态。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、status

status是授权状态。

这个字段是字符串类型。这个字段必填。

合法值有authenticated、not_configured、unavailable、error。authenticated表示已授权。not_configured表示未配置。unavailable表示不可用。error表示出错。

### 2、message

message是人类可读的状态说明。这个字段是字符串类型。默认是None。

### 3、user

user是已授权用户的显示值。这个字段是字符串类型。默认是None。

### 4、verified

verified表示状态是否来自实时的令牌验证。

这个字段是布尔类型。默认是false。

false表示状态可能是缓存的。true表示刚刚验证过令牌。

## 三、它和谁协作

这个类作为LarkIntegrationStatusResponse的auth字段类型。

由_auth_probe_to_response函数从LarkAuthProbe探测对象转换而来。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

授权状态是Lark集成的关键信息。verified字段区分实时验证和缓存状态。

这个类只有4个字段。

所以评3分。
