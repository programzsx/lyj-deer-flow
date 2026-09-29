# GatewayConfig档案

来源文件：`backend/app/gateway/config.py`

## 一、这个类是干什么的

这个类是API Gateway的配置模型。

这个类继承自Pydantic的`BaseModel`。

这个类只承载三个Gateway启动参数。

第一个参数是监听主机。

第二个参数是监听端口。

第三个参数是是否开启文档端点。

模块还提供一个模块级函数`get_gateway_config()`。

这个函数从环境变量读配置，构造配置单例。

环境变量有三个。

`GATEWAY_HOST`是主机，默认`0.0.0.0`。

`GATEWAY_PORT`是端口，默认8001。

`GATEWAY_ENABLE_DOCS`是文档开关，默认true。

空字符串视为未设置。`int("")`会让`create_app()`导入直接失败，所以这里用`or`兜底。

## 二、类的成员

这个类有三个Pydantic字段。

### 1、字段host

`host`是监听主机字符串，默认`0.0.0.0`。

`host`是Gateway服务器绑定的地址。

### 2、字段port

`port`是监听端口整数，默认8001。

Gateway API监听8001端口。

### 3、字段enable_docs

`enable_docs`是布尔值，默认真。

`enable_docs`控制Swagger、ReDoc、OpenAPI端点是否可用。

设为false可以关闭`/docs`、`/redoc`、`/openapi.json`。

### 4、模块级函数get_gateway_config

`get_gateway_config()`返回配置单例。

第一次调用从环境变量构造配置。

后续调用返回缓存的实例。

## 三、它和谁协作

这个类由`get_gateway_config()`构造和管理。

消费方是Gateway应用启动代码。

`create_app()`拿这个配置决定监听参数和文档开关。

## 四、重要性评级

评级：3分。

理由：这个类是Gateway的启动配置载体。三个字段都很简单，属于服务端口和文档开关。这个类没有复杂逻辑，也没有安全边界。但配置错会让服务起不来或文档意外暴露。所以这个类是简单的基础配置类。
