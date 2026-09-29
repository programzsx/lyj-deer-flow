# app.gateway.config-档案

源码路径是backend/app/gateway/config.py。

## 一、这个模块是干什么的

config.py定义GatewayConfig。

GatewayConfig是Gateway自身的配置。

配置包含监听地址、监听端口、文档开关。

这个模块只有27行。

## 二、模块里的主要成员

### 1、GatewayConfig

GatewayConfig是pydantic模型。

host默认是0.0.0.0。

port默认是8001。

enable_docs默认是true。

enable_docs控制Swagger和OpenAPI端点。

### 2、get_gateway_config

get_gateway_config读取配置。

配置从环境变量读取。

环境变量是GATEWAY_HOST、GATEWAY_PORT、GATEWAY_ENABLE_DOCS。

配置对象有全局缓存。

## 三、它和谁协作

上游是app.py的启动逻辑。

启动时用host和port起服务。

下游是环境变量。

Docker部署通过环境变量改端口。

## 重要性评级

评级是4分。

理由如下。

端口和地址配置是服务启动的前提。

没有这个模块，Gateway没有配置来源。

enable_docs控制API文档开关。

但这个模块只有27行。

就是一个pydantic模型加一个读取函数。

配置项只有三个。

业务功能完全不依赖它。

所以评级是4分。
