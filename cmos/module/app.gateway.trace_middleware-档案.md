# app.gateway.trace_middleware-档案

源码路径是backend/app/gateway/trace_middleware.py。

## 一、这个模块是干什么的

trace_middleware.py是请求链路追踪中间件。

中间件给每个HTTP请求绑定一个trace id。

trace id写进响应头。

下游全部读同一个ContextVar。

这个模块只有92行。

## 二、模块里的主要成员

### 1、TraceMiddleware

TraceMiddleware是中间件类。

每个请求绑定一个trace id。

trace id写到TRACE_ID_HEADER响应头。

### 2、不设门控

中间件故意不设门控。

trace id必须存在于每条路径。

下游不用判断有没有trace id。

下游包括运行元数据、子智能体、记忆后台线程。

下游读一个ContextVar就够。

### 3、日志开关

logging.enhanced.enabled只决定日志是否打印trace id。

开关不决定trace id是否存在。

追踪器安装用MONOCLE_TRACING。

追踪器在app.py启动时安装。

## 三、它和谁协作

上游是app.py注册的中间件链。

中间件是洋葱模型的最外层之一。

下游是deerflow.trace_context的trace上下文。

运行元数据、子智能体、记忆线程都读trace id。

## 重要性评级

评级是5分。

理由如下。

链路追踪是排障的基础。

一个请求跨多个下游组件。

统一trace id让日志能串起来。

故意不设门控的设计避免了下游分支。

但它是横切辅助功能。

没有它，功能照常运行，只是排障困难。

体量小。

所以评级是5分。
