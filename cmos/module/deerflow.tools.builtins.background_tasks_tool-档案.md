# deerflow.tools.builtins.background_tasks_tool-档案

## 一、这个模块是干什么的

这个文件提供当前线程MCP后台任务的自然语言管理工具。

长运行的MCP工作走持久化任务运行时。

任务不会留在agent循环里轮询。

但模型需要查看和取消这些任务。

这个文件提供两个工具。

工具是list_background_tasks和cancel_background_task。

## 二、模块里的主要成员

### 1、list_background_tasks工具

这个工具列出本聊天的当前和最近的持久化后台任务。

实现先解析当前线程id。

线程id解析不了就返回空列表。

实现调用MCP任务提交器的list_tasks。

list_tasks带thread_id、user_id、thread_incarnation。

limit被夹在1到50之间。

active_only为True时只返回还活跃的任务。

### 2、cancel_background_task工具

这个工具取消本聊天里一个活跃的后台任务。

task参数是可选的精确任务名或任务id。

多个任务活跃时必须提供精确名字。

实现调用cancel_matching_task。

找不到任务时返回取消失败和原因。

取消成功返回确认。

远端MCP任务句柄不需要也不暴露。

取消是请求式的。

后台服务拥有远端调用并负责重试。

### 3、_public_task辅助函数

这个函数把任务记录裁剪成公开字段。

公开字段有task_id、task_name、status、时间戳、error、cancel_requested。

task_name和error经过标签中和。

中和让不可信内容无法伪造标记。

### 4、身份解析

线程id和用户id复用list_uploaded_files_tool的解析函数。

thread_incarnation来自mcp_scope的运行时读取。

 incarnation保证任务查询绑定到正确的线程世代。

## 三、它和谁协作

它依赖deerflow.mcp.tasks.runtime的任务提交器。

它依赖deerflow.mcp_scope的incarnation读取。

它依赖list_uploaded_files_tool的身份解析函数。

它被tools.py在MCP任务运行时可用时加入工具集。

## 四、重要性评级

评级是5分。

理由是这个文件是MCP长运行任务的管理入口。

模型只能通过这两个工具查看和取消后台任务。

任务句柄不暴露，取消是请求式的。

这些设计保持了数据库是唯一事实来源的契约。

不评高分的原因是它是条件加载的工具。

MCP任务运行时不可用时它不存在。
