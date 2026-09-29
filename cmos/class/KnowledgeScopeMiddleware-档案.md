# KnowledgeScopeMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/knowledge_scope_middleware.py`

## 一、这个类是干什么的

KnowledgeScopeMiddleware在模型和工具两个边界上强制每条消息的知识范围。

它做三件事。

第一件是投影执行范围。运行被授权的范围通过它暴露给模型。

第二件是删减消息快照。把范围和展示数据从模型消息里移掉。

第三件是强制禁用。知识搜索被禁用时。调用`knowledge_search`直接收到阻止消息。而且不读存储。不碰RAGFlow。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `before_agent`：运行开始时确定本运行的知识范围。
- `wrap_model_call`和`awrap_model_call`：模型调用边界。投影范围。删减消息。
- `wrap_tool_call`和`awrap_tool_call`：工具调用边界。禁用时阻止knowledge_search调用。

辅助方法：

- `_prepare_model_request`：执行消息投影和删减。
- `_disabled_tool_message`：构建禁用时的阻止消息。

## 三、它和谁协作

- 它挂在中间件链上。紧跟在InputSanitizationMiddleware之后。
- 它消费Gateway准入的运行上下文里的范围信息。
- 它和knowledge_search工具协作。禁用信号来自配置。
- 它独立于RAGFlow和知识存储做判断。

## 四、重要性评级

评级：6/10。

理由：知识范围控制影响权限边界。被授权之外的执行不该被模型看到。被禁用的搜索不该打到后端。但它的适用面限于知识功能。所以给6分。