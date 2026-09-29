# app.gateway.routers.subagent_batches-档案

源码路径是backend/app/gateway/routers/subagent_batches.py。

## 一、这个模块是干什么的

subagent_batches.py是子智能体批处理的进度和控制API。

一个批次包含多个子智能体条目。

条目在后台并行运行。

这个模块让用户查询批次进度和控制批次。

这个模块只有130行，纯读加控制。

## 二、模块里的主要成员

路由前缀是/api/threads/{thread_id}/subagent-batches。

### 1、端点列表

- GET ""列出批次。
- GET "/{batch_id}"读取批次详情。
- GET "/{batch_id}/items"列出批次条目。
- POST "/{batch_id}/pause"暂停批次。
- POST "/{batch_id}/resume"恢复批次。
- POST "/{batch_id}/cancel"取消批次。
- POST "/{batch_id}/items/{item_id}/retry"重试一个条目。
- GET "/{batch_id}/results.jsonl"导出条目结果。

### 2、控制语义

pause暂停批次执行。

resume恢复执行。

cancel取消整个批次。

retry重试单个失败条目。

results.jsonl流式导出全部条目结果。

### 3、归属校验

所有端点做owner检查。

批次属于某个线程。

线程属于某个用户。

无权用户看不到批次。

## 三、它和谁协作

上游是前端聊天页的批次进度面板。

下游是app.subagent_batches的SubagentBatchService。

服务持有批次仓库。

批次提交入口在子智能体工具侧。

## 重要性评级

评级是5分。

理由如下。

子智能体批处理是高级功能。

批量并行让复杂任务更快完成。

进度查询和控制给了用户可见性。

results.jsonl导出方便结果消费。

但批次是可选路径。

普通对话不产生批次。

核心轮询逻辑在app.subagent_batches包里。

所以评级是5分。
