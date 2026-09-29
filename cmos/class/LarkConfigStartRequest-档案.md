# LarkConfigStartRequest档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是启动Lark首次配置的请求体。

Lark集成第一次连接时。需要用户注册或配置一个Lark应用。配置也用浏览器设备码流程。

前端调用POST /api/integrations/lark/config/start接口。后端用这个类接收品牌选择。这个类是一个Pydantic模型。

这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、brand

brand是要注册应用的Lark品牌。

这个字段是字符串类型。默认是feishu。

值是feishu或lark。feishu是中国版飞书。lark是国际版。

## 三、它和谁协作

这个类被POST /api/integrations/lark/config/start路由使用。

配置启动后返回验证地址和设备码。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是2分。

理由如下。

这个类只有1个字段。这个类只是品牌选择的载体。

配置流程逻辑在集成模块里。

所以评2分。
