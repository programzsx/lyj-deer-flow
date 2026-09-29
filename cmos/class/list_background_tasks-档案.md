# list_background_tasks-档案

## 一、这个类是干什么的

list_background_tasks不是类。

list_background_tasks是tools/builtins/background_tasks_tool.py里的工具函数。

这个工具列出当前会话的当前和最近的持久化后台任务。

这些后台任务是MCP长任务。

这个工具是自然语言管理工具。

它把任务记录转成公开的任务字典。

这个工具在MCP任务运行时可用时才加入工具集。

这个模块位于backend/packages/harness/deerflow/tools/builtins/background_tasks_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_public_task函数

这个函数把任务记录转成公开字典。

字段包括task_id、task_name、status、created_at、updated_at、error、cancel_requested。

task_name和error经过neutralize_untrusted_tags处理。

目的是不受信任的标签不能伪造框架上下文。

它不暴露远程MCP任务handle。

### 2、list_background_tasks工具

参数如下。

- runtime是注入的运行时。
- active_only为True时只返回仍活跃的任务。

流程如下。

第一步解析thread_id。解析失败返回错误。

第二步调用MCP任务提交器的list_tasks。

参数包括thread_id、user_id、thread_incarnation。

limit限制在1到50之间。

第三步把记录转成公开任务列表。

### 3、cancel_background_task工具

同模块的另一个工具。

它取消当前会话的一个活跃后台任务。

多个任务活跃时必须提供确切的任务名。

远程MCP任务handle从不需要也不暴露。

取消是记录取消请求并立即返回。

后台服务拥有远程调用和重试。

## 三、它和谁协作

- get_mcp_task_submitter提供任务列表和取消能力。
- runtime_thread_incarnation提供会话身份。
- neutralize_untrusted_tags处理不受信任的标签。
- list_uploaded_files_tool的内部helper解析thread_id和user_id。

## 四、重要性评级

评级是5分。

理由如下。

这个工具让代理能查看和取消持久化后台任务。

它严格不暴露远程handle。

标签中性化防止伪造。

但它逻辑简单。

是查询和取消的薄封装。

扣掉5分。
