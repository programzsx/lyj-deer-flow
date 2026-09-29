# LarkAuthStartRequest档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是启动Lark用户授权的请求体。

用户要授权DeerFlow访问Lark。授权用浏览器设备码流程。用户没有终端也能完成授权。

前端调用POST /api/integrations/lark/auth/start接口。后端用这个类接收授权参数。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、recommend

recommend表示是否请求官方推荐的自动批准权限。

这个字段是布尔类型。默认是false。

### 2、domains

domains是可选的Lark授权域。

这个字段是字符串列表类型。默认是空列表。

例如calendar或docs。授权范围可以按域增量授予。

### 3、scope

scope是可选的显式OAuth权限字符串。

这个字段是字符串类型。默认是None。

### 4、generation

generation是可选的当前集成流程代数。

这个字段是字符串类型。默认是None。最短1个字符。最长64个字符。

代数用于并发保护。旧的授权完成会被拒绝。

## 三、它和谁协作

这个类被POST /api/integrations/lark/auth/start路由使用。

启动后返回验证地址和设备码。用户在浏览器完成授权。

generation由服务端签发。持久存在凭证锁下。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

用户授权是Lark集成的必要步骤。这个类是授权启动的参数载体。

增量权限授予是灵活设计。

所以评3分。
