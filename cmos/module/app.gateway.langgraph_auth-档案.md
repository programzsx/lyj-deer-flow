# app.gateway.langgraph_auth-档案

源码路径是backend/app/gateway/langgraph_auth.py。

## 一、这个模块是干什么的

langgraph_auth.py是LangGraph兼容的认证处理器。

默认运行时内嵌在FastAPI Gateway里。

脚本和Docker部署不加载这个模块。

LangGraph Studio和LangGraph Server走这个模块。

这个模块复用Gateway的JWT和CSRF规则。

两种模式的会话校验保持一致。

这个模块有328行。

## 二、模块里的主要成员

### 1、authenticate

authenticate是认证入口。

它校验JWT会话cookie。

它提取user_id。

它在状态变更方法上执行CSRF检查。

状态变更是POST、PUT、DELETE、PATCH。

_check_csrf执行CSRF检查。

### 2、owner过滤

add_owner_filter返回元数据过滤器。

过滤器让每个用户只看到自己的线程。

这是数据隔离的关键。

### 3、线程世代

_scrub_run_incarnation清理运行世代。

_ensure_standalone_thread_incarnation补齐线程世代。

_standalone线程是Studio直建的线程。

_bind_standalone_run_incarnation绑定运行世代。

世代防止旧数据被误读。

### 4、独立线程

_read_standalone_thread读取独立线程。

独立线程没有Gateway元数据。

## 三、它和谁协作

上游是LangGraph Studio和langgraph.json的auth.path。

下游是Gateway的JWT和CSRF逻辑。

线程数据走线程元数据存储。

## 重要性评级

评级是5分。

理由如下。

LangGraph Studio兼容是开发者体验的一部分。

Studio调试智能体靠这个模块。

认证规则与Gateway共享，保持一致。

但脚本和Docker部署不加载它。

它只服务于LangGraph工具链。

普通用户不经过这个模块。

所以评级是5分。
