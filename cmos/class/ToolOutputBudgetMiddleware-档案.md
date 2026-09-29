# ToolOutputBudgetMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_output_budget_middleware.py`

## 一、这个类是干什么的

ToolOutputBudgetMiddleware对工具输出强制单结果预算。

超大工具结果的处理是两条路。

第一条路是外部化。结果持久化到磁盘。替换成紧凑的类型化摘要。摘要里带文件引用。模型需要细节时用read_file读。

第二条路是截断回退。磁盘持久化不可用时。头尾截断。保证单个大结果不撑爆模型上下文。

模型调用钩子还管工具调用的另一个 bulky 一面。
write_file调用的content参数。

成功写入之后。磁盘上的文件是事实来源。
先读后写门槛强制下一次修改前先read_file。
所以一旦同一文件路径有了更新的成功读取或写入。
历史的content副本就是冗余的。

这种被取代的内容在模型绑定的请求里被换成短的确定性占位符。
状态消息、checkpoint、工具回执、循环检测、运行日志保留原始参数。
不外部化到磁盘。文件本身就是引用。
最近keep_recent_writes次成功写入保持可见。
模型不用读文件就能说自己刚写了什么。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`和`awrap_tool_call`：工具调用边界。超大结果外部化或截断。
- `wrap_model_call`和`awrap_model_call`：模型调用边界。截断超大历史工具输出。省略被取代的写作载荷。

核心方法：

- `from_app_config`：从应用配置构造。
- `release_policy_parameters`：声明影响行为的配置。
- `_budget_model_request`：执行请求副本里的截断和省略。

## 三、它和谁协作

- 它挂在中间件链上。在InputSanitization之后、ToolResultSanitization之前。
- 它和ReadBeforeWriteMiddleware共用tool_call_args辅助器做跨表面重写。
- 外部化的文件进thread outputs下的tool_output.storage_subdir。
- 外部化产生的read_file引用和先读后写门槛协作。
- 处理反馈文件被排除在工作区变更扫描和交付验证之外。

## 四、重要性评级

评级：8/10。

理由：单个大工具结果就能撑爆模型上下文。网页抓取、大文件读取、目录列举都是高发场景。外部化加摘要的设计保住了信息可达性。写作载荷省略消除了最大的冗余。它是上下文成本控制的核心一环。所以给8分。