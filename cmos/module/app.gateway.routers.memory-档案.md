# app.gateway.routers.memory-档案

源码路径是backend/app/gateway/routers/memory.py。

## 一、这个模块是干什么的

memory.py是记忆数据API。

记忆是跨线程的全局知识。

智能体把用户偏好、重要事实存进记忆。

后续对话会读取记忆。

这个模块让用户查看和管理记忆。

这个模块有520多行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- GET "/memory"读取记忆。
- POST "/memory/reload"重新加载记忆。
- DELETE "/memory"清空记忆。
- POST "/memory/facts"创建一条记忆事实。
- DELETE "/memory/facts/{fact_id}"删除一条记忆事实。
- PATCH "/memory/facts/{fact_id}"修改一条记忆事实。
- GET "/memory/export"导出记忆。
- POST "/memory/import"导入记忆。
- GET "/memory/config"读取记忆配置。
- GET "/memory/status"读取记忆状态。

### 2、用户隔离

_resolve_memory_user_id解析记忆归属用户。

记忆数据是按用户隔离的。

用户只能看到自己的记忆。

### 3、错误映射

_map_memory_fact_value_error映射值错误。

_map_memory_manager_error映射冲突和损坏错误。

_unsupported_501对不支持的操作返回501。

## 三、它和谁协作

上游是前端记忆管理页面。

下游是deerflow.agents.memory的MemoryManager。

记忆管理器负责读写记忆存储。

app.py的lifespan初始化记忆管理器。

记忆后台线程也会写记忆。

## 重要性评级

评级是7分。

理由如下。

记忆是DeerFlow的核心能力之一。

智能体的长期个性化靠记忆。

没有记忆，每次对话都从零开始。

用户管理界面给了用户控制权。

导入导出支持记忆迁移。

但记忆读写在运行时直接走MemoryManager。

路由只是管理入口。

所以评级是7分。
