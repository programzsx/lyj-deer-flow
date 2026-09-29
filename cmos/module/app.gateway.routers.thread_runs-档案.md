# app.gateway.routers.thread_runs-档案

源码路径是backend/app/gateway/routers/thread_runs.py。

## 一、这个模块是干什么的

thread_runs.py是线程级运行路由。

运行是智能体的一次执行。

用户在对话里发一条消息，就触发一次运行。

这个模块实现LangGraph Platform的runs API。

底层用deerflow.agents.runs.RunManager和stream_bridge.StreamBridge。

SSE格式对齐LangGraph Platform协议。

前端的useStream React钩子不需要修改就能直接用。

这个模块有1800多行，是路由里最大的文件。

## 二、模块里的主要成员

路由前缀是/api/threads。

### 1、创建运行

- POST "/{thread_id}/runs"创建后台运行。
- POST "/{thread_id}/runs/stream"创建运行并SSE流式返回。
- POST "/{thread_id}/runs/wait"创建运行并阻塞等待结果。
- POST "/{thread_id}/runs/{run_id}/cancel"取消运行。
- POST "/{thread_id}/runs/{run_id}/stream"接入一次已存在运行的流。

stream端点是用户聊天的主要路径。

流式返回让用户实时看到智能体的输出。

### 2、重新生成

- POST "/{thread_id}/runs/regenerate/prepare"准备重新生成。
- POST "/{thread_id}/runs/edit-regenerate/prepare"准备编辑重跑。

这两个端点为重跑准备干净的输入。

准备好的输入不含服务端持有的状态元数据。

### 3、查询历史

- GET "/{thread_id}/runs"列出运行。
- GET "/{thread_id}/runs/page"分页列出运行。
- GET "/{thread_id}/runs/{run_id}"读取单次运行。
- GET "/{thread_id}/runs/{run_id}/join"等待并接入运行。
- GET "/{thread_id}/messages"列出消息。
- GET "/{thread_id}/messages/page"分页列出消息。
- GET "/{thread_id}/runs/{run_id}/messages"读取单次运行的消息。
- GET "/{thread_id}/runs/{run_id}/events"读取运行事件流。

### 4、运行数据

- GET workspace-changes端点返回工作区变更摘要。
- GET token-usage端点返回令牌用量聚合。
- POST "/{thread_id}/runs/{run_id}/artifacts/archive"归档运行产物为ZIP。

## 三、它和谁协作

上游是前端聊天界面。

用户每发一条消息就调用一次stream端点。

核心逻辑委托给app.gateway.services层。

services层负责创建运行、格式化SSE帧、消费流事件。

依赖RunManager和StreamBridge。

授权走app.gateway.authz。

请求模型定义在app.gateway.run_models。

## 重要性评级

评级是10分。

理由如下。

这个模块是智能体执行的HTTP入口。

用户每一次提问都走POST /runs/stream。

没有这个模块，智能体完全无法被调用。

流式响应直接决定聊天体验。

SSE协议兼容LangGraph SDK，是前后端的契约核心。

这个模块有1800多行，是最大的路由文件。

它和threads.py、services.py共同构成核心运行路径。

所以评级是10分。
