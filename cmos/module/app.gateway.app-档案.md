# app.gateway.app-档案

源码路径是backend/app/gateway/app.py。

## 一、这个模块是干什么的

app.py是FastAPI应用本体。

app.py把所有零件组装成一个完整服务。

组装包括创建FastAPI实例、注册路由、注册中间件、启动生命周期。

Gateway监听8001端口。

所有REST API都由这个应用提供。

这个模块有将近1200行。

## 二、模块里的主要成员

### 1、create_app

create_app是应用工厂。

create_app创建FastAPI实例。

create_app注册CORS中间件。

create_app注册AuthMiddleware认证中间件。

create_app注册CSRFMiddleware。

create_app注册TraceMiddleware。

中间件的注册顺序决定洋葱模型层次。

### 2、路由注册

app.py从routers导入13个模块。

app.py直接导入其余20多个路由。

include_router把每个路由挂到应用上。

### 3、lifespan生命周期

lifespan是应用的启动和关闭流程。

启动时初始化运行时和持久化引擎。

启动时初始化记忆管理器。

启动时启动定时任务服务。

启动时启动渠道服务。

启动时启动MCP任务服务。

启动时启动子智能体批处理服务。

启动时清理过期的上传暂存文件。

启动时跑回收站保留清扫。

启动时检查认证关闭警告。

关闭时停掉渠道服务。

关闭时处理在途运行。

关闭时做优雅清理。

### 4、插件支持

插件可以贡献授权解析器。

插件可以贡献证据读取器。

插件授权失败按策略决定放行或拒绝。

### 5、追踪初始化

setup_monocle_tracing_if_enabled在启动时装追踪器。

追踪器装在启动时，不在导入时。

这保证普通导入不会装全局追踪器。

## 三、它和谁协作

上游是Nginx反代和全部调用方。

下游是全部路由模块、中间件、harness层服务。

lifespan初始化的服务包括定时任务、渠道、MCP任务、批处理。

依赖注入走app.gateway.deps。

## 重要性评级

评级是10分。

理由如下。

app.py是整个Gateway的组装点。

没有它，所有零件都无法协同。

全部路由、全部中间件、全部后台服务都挂在这里。

lifespan是服务启动和关闭的唯一入口。

删除这个模块等于删除整个后端服务。

所以评级是10分。
