# app.gateway.routers.threads-档案

源码路径是backend/app/gateway/routers/threads.py。

## 一、这个模块是干什么的

threads.py是线程路由。

线程是DeerFlow里的一次对话。

用户每开一个新对话，就创建一个线程。

这个模块负责线程的创建、查询、修改、删除。

这个模块还负责线程的状态和历史。

前端聊天页面的会话列表、会话切换、会话删除，都调用这个模块。

这个模块有1900多行，是路由里最大的文件之一。

## 二、模块里的主要成员

路由前缀是/api/threads。

### 1、创建和查询

- POST ""创建新线程。
- POST "/search"搜索线程列表。
- GET "/{thread_id}"读取单个线程。
- PATCH "/{thread_id}"修改线程元数据。
- POST "/{thread_id}/move"把线程移入或移出项目。
- DELETE "/{thread_id}"删除线程。

search端点委托给配置的ThreadMetaStore实现。

move端点只做组织关系调整，不动历史和运行状态。

删除线程会做完整清理。

清理范围包括线程文件系统数据、检查点、历史运行、事件、反馈、元数据。

### 2、分支

POST "/{thread_id}/branches"创建分支线程。

分支用回放检查点从一次完成的助手回合创建新线程。

新线程保留原对话的上下文。

### 3、目标

- GET "/{thread_id}/goal"读取线程目标。
- PUT "/{thread_id}/goal"设置线程目标。
- DELETE "/{thread_id}/goal"删除线程目标。

### 4、上下文压缩

POST "/{thread_id}/compact"手动压缩上下文。

上下文太长会消耗大量token。

压缩把历史消息收敛成摘要。

### 5、状态和历史

- GET "/{thread_id}/state"读取线程状态。
- POST "/{thread_id}/state"修改线程状态。
- POST "/{thread_id}/history"读取线程历史。

状态响应里的channel values经过serialize_channel_values序列化。

序列化保证LangChain消息对象变成JSON安全的字典。

这个格式匹配LangGraph Platform协议。

前端的useStream React钩子不需要任何修改就能工作。

## 三、它和谁协作

上游是前端聊天界面。

前端创建会话、列会话、删会话都调用这些端点。

下游是app.gateway.services层的检查点访问器。

线程状态和历史读写检查点数据。

线程元数据存储在ThreadMetaStore里。

授权走app.gateway.authz的require_permission装饰器。

依赖注入走app.gateway.deps。

## 重要性评级

评级是10分。

理由如下。

线程是整个产品的核心概念。

没有线程就没有对话。

对话没有状态就没有上下文。

这个模块承载线程的全部生命周期。

删除、分支、压缩、状态、历史都是高频操作。

thread_runs.py负责在线程上运行智能体。

threads.py负责线程本身。

两者合起来是核心运行路径。

所以评级是10分。
