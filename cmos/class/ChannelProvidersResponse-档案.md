# ChannelProvidersResponse档案

类定义在backend/app/gateway/routers/channel_connections.py。

## 一、这个类是干什么的

这个类是IM渠道供应商列表的响应体。

前端调用渠道供应商接口。前端要展示所有可连接的IM平台。

后端用这个类把供应商列表打包返回。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、enabled

enabled表示渠道功能是否全局开启。这个字段是布尔类型。这个字段必填。

### 2、providers

providers是供应商列表。

这个字段类型是ChannelProviderResponse列表。这个字段必填。

## 三、它和谁协作

这个类被渠道供应商查询路由使用。

providers字段由ChannelProviderResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是列表容器。实际供应商信息都在ChannelProviderResponse里。

所以评3分。
