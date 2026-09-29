# app.gateway.routers.mcp_tasks-档案

源码路径是backend/app/gateway/routers/mcp_tasks.py。

## 一、这个模块是干什么的

mcp_tasks.py是MCP长任务的线程级读API。

有些MCP工具运行时间很长。

长任务被移出智能体循环后台轮询。

这个模块让前端查询这些任务的进度。

这个模块只有170行，纯读。

## 二、模块里的主要成员

路由前缀是/api/threads/{thread_id}/mcp-tasks。

### 1、端点列表

- GET ""列出本线程的MCP任务。
- GET "/{task_id}"读取单个任务详情。
- POST "/{task_id}/cancel"取消一个任务。

### 2、展示逻辑

_short_error截短错误信息。

_tracking_degraded判断轮询是否降级。

_list_item构建列表项。

_detail构建详情。

详情比列表项多返回轮询历史和中间结果。

### 3、归属校验

_current_user_id从请求解析用户。

_current_thread_incarnation校验线程世代。

线程被删除重建后世代变化。

旧世代的数据不可见。

## 三、它和谁协作

上游是前端聊天页面的任务进度展示。

下游是app.mcp_tasks的McpTaskService。

服务持有任务仓库和轮询循环。

提交入口在MCP工具侧，不在路由侧。

## 重要性评级

评级是5分。

理由如下。

长任务是MCP体验的重要部分。

没有这个API，用户看不到后台任务进度。

取消端点给用户控制权。

但这个模块是纯读加一个取消。

核心轮询逻辑在app.mcp_tasks包里。

没有MCP长任务时这个模块空转。

所以评级是5分。
