# TraceMiddleware档案

来源文件：`backend/app/gateway/trace_middleware.py`

## 一、这个类是干什么的

这个类是Gateway请求的追踪中间件。

这个类给每个HTTP请求绑定一个trace id。

trace id是请求的关联标识。

排障时用户拿trace id去日志里找对应的请求。

这个类做三件事。

第一件是读入请求头里的trace id。没有就生成一个。

第二件是把trace id放进`request_trace_context`上下文。

下游的运行worker、子代理、后台记忆线程都读这一个上下文变量，不用分支判断"可能没有trace id"。

第三件是把trace id写到响应头里。

这个类是刻意不加开关的。

trace id必须存在于每个路径上。

`logging.enhance.enabled`只决定日志记录是否打印trace id，不决定trace id是否存在。

所以这个中间件不读`AppConfig`，也不受重启才生效的配置约束。

## 二、类的成员

### 1、方法__init__

`__init__`只保存下一个ASGI应用。

这个类不继承Starlette的中间件基类。

这个类是原生ASGI中间件，实现`__call__`签名。

### 2、方法__call__

`__call__`是ASGI入口。

非HTTP作用域直接透传。

HTTP请求的处理流程分四步。

第一步从请求头读入trace id。

第二步进入`request_trace_context`上下文。

第三步包装`send`函数。`http.response.start`消息到来时把trace id写进响应头。

在`http.response.start`写头而不是在完成的响应上写，覆盖SSE和其他流式响应，不消耗body。

第四步处理未捕获异常。

异常且响应还没开始时，这个类自己发一个带trace id的500。

Starlette的`ServerErrorMiddleware`发出的500不带这个头，因为那个中间件位于所有用户中间件之外。

用户最需要关联日志的那个500响应反而会没有trace id。

所以这个类接管了这个500。

这个500是CORS不透明的。这个类在`CORSMiddleware`之外，异常已经越过了CORS中间件。

复制Origin白名单会让两个策略漂移，所以这里刻意不修。

## 三、它和谁协作

这个类在Gateway的ASGI中间件栈里，位于最外层。

这个类依赖`deerflow.trace_context`的`request_trace_context`和`TRACE_ID_HEADER`。

下游的运行worker、子代理、记忆线程都消费这个类放进上下文的trace id。

这个类的响应头被前端和排障流程消费。

`CSRFMiddleware`的`CORS_EXPOSED_HEADERS`列出了trace id头，让分源浏览器客户端能读回。

## 四、重要性评级

评级：8分。

理由：这个类是全系统请求追踪的唯一源头。一个trace id贯穿运行worker、子代理、记忆线程和HTTP响应。没有这个类，排障就没有请求级关联标识。这个类的500接管设计让用户最需要的错误响应也带trace id。但这个类不涉及业务逻辑和安全决策。所以这个类是可观测性的关键基础组件。
