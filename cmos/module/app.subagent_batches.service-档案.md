# app.subagent_batches.service 档案

## 一、这个模块是干什么的

这个模块是一个兼容性导入垫片。

这个模块只有5行代码。

这个模块把harness层的子智能体批量服务重新导出。

真正的实现住在`deerflow.subagents.batch_service`。

app层历史上拥有这个服务。

后来实现搬到了harness层。

搬到harness层是为了让实现可以被harness的测试直接覆盖。

旧路径`app.subagent_batches.service`保留。

旧路径只是转发。

旧调用方不用改。

## 二、模块里的主要成员

### 1、SubagentBatchService

这个类是从harness层导入的。

这个类是唯一导出的成员。

真正的实现在`deerflow.subagents.batch_service`。

那个类是持久化子智能体批量的执行引擎。

批量是一个子智能体委托的持久化形式。

批量带多个条目。

每个条目是一次子智能体运行。

批量服务负责提交、执行、状态跟踪、取消、重试。

批量的状态持久化在数据库里。

批量的仓库和worker状态是分开的。

历史不依赖worker也能读。

前端通过API查询批量进度。

Gateway把批量相关的HTTP路由挂载在`/api/threads/{thread_id}/subagent-batches`。

路由模块就是从导入这个垫片转而依赖服务的。

## 三、它和谁协作

### 1、它依赖谁

它依赖`deerflow.subagents.batch_service`。

这是一行转发导入。

### 2、谁调用它

`app.gateway.routers`的子智能体批量路由模块引用它。

Gateway的依赖注入通过它拿到服务实例。

新的代码应该直接导入`deerflow.subagents.batch_service`。

这个垫片只是为了兼容旧路径。

## 四、重要性评级

### 1、评级

2分。

### 2、理由

这个模块几乎没有任何实质内容。

它是一行兼容性转发。

真正的逻辑全在harness层。

它的存在价值只是保持旧导入路径不破坏。

删掉它。

更新两三个调用方。

系统完全不受影响。

它不代表任何独立的功能面。

也不承载任何设计决定。

所以评2分。
