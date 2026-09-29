# app.gateway.routers.feedback-档案

源码路径是backend/app/gateway/routers/feedback.py。

## 一、这个模块是干什么的

feedback.py是运行反馈路由。

用户可以对一次运行点踩或点赞。

反馈可以精确到某条消息。

这个模块负责反馈的创建、查询、统计、删除。

## 二、模块里的主要成员

路由前缀是/api/threads。

### 1、端点列表

- PUT "/{thread_id}/runs/{run_id}/feedback"覆盖式更新反馈。
- POST "/{thread_id}/runs/{run_id}/feedback"创建反馈。
- GET "/{thread_id}/runs/{run_id}/feedback"列出反馈。
- GET "/{thread_id}/runs/{run_id}/feedback/stats"返回反馈统计。
- DELETE "/{thread_id}/runs/{run_id}/feedback"删除整次运行的反馈。
- DELETE "/{thread_id}/runs/{run_id}/feedback/{feedback_id}"删除单条反馈。

### 2、数据模型

FeedbackResponse表示一条反馈。

反馈记录线程、运行、消息、评分。

stats端点返回点赞和点踩的数量。

## 三、它和谁协作

上游是前端聊天页面的点赞点踩按钮。

下游是反馈存储。

反馈数据挂在运行上。

删除运行时会连带清理反馈。

## 重要性评级

评级是4分。

理由如下。

用户反馈是改进质量的重要信号。

但反馈本身是辅助功能。

没有反馈，智能体照常运行。

这个模块逻辑简单，就是CRUD。

删除运行会清理反馈，所以反馈不是持久资产。

所以评级是4分。
