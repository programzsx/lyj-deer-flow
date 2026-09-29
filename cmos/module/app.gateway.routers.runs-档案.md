# app.gateway.routers.runs-档案

源码路径是backend/app/gateway/routers/runs.py。

## 一、这个模块是干什么的

runs.py是无状态运行路由。

thread_runs的运行要挂在一个已有线程上。

runs.py的运行不需要已有线程。

请求不携带thread_id时自动创建临时线程。

请求携带thread_id时复用该线程。

复用保留对话历史。

这个模块只有145行，核心逻辑在services层。

## 二、模块里的主要成员

路由前缀是/api/runs。

### 1、端点列表

- POST "/stream"创建运行并SSE流式返回。
- POST "/wait"创建运行并阻塞等待。
- GET "/{run_id}/messages"读取运行消息。
- GET "/{run_id}/feedback"读取运行反馈。

### 2、无状态语义

stream和wait都不要求预先创建线程。

这让脚本和一次性调用很方便。

LangGraph SDK的默认runs调用走这里。

创建的临时线程对话历史保留。

### 3、薄适配

这个模块是薄HTTP适配。

创建运行、SSE格式化、流消费都在services层。

授权走require_permission。

## 三、它和谁协作

上游是LangGraph SDK和外部脚本。

下游是app.gateway.services层。

services层再调RunManager和StreamBridge。

请求模型定义在app.gateway.run_models。

## 重要性评级

评级是7分。

理由如下。

无状态运行是脚本接入的主要方式。

LangGraph SDK的兼容性靠这些端点。

stream和wait是标准运行API。

自动建线程的设计兼顾了便捷和历史保留。

但这个模块本身很薄。

核心逻辑都在services和thread_runs。

网页前端主要走thread_runs。

所以评级是7分。
