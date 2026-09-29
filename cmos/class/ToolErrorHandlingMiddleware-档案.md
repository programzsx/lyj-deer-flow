# ToolErrorHandlingMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_error_handling_middleware.py`

## 一、这个类是干什么的

ToolErrorHandlingMiddleware把工具异常转换成错误ToolMessage。

没有它。一个工具抛异常会中止整个运行。

有了它。异常被捕获。转换成带错误信息的ToolMessage。
代理收到错误结果。可以继续跑。换个方式重试。或者报告失败。

它还给需要的结果盖上生产者绑定的元数据。

每一张经过它的结果都带`deerflow_tool_meta`条目。
状态、错误类型、模型能否自行恢复、推荐下一步动作、来源。
下游消费者读这个键。不再解析文本。

它还盖技能读取元数据。供下游的持久上下文采集使用。

任务工具的异常包装也有专门的结构化元数据。
任务工具结果的文本和结构化元数据从同一套输入生成。
调用方不用手写第二套协议字符串。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`：同步钩子。跑处理器。异常转成错误ToolMessage。给结果盖deerflow_tool_meta。
- `awrap_tool_call`：异步版本的同一个钩子。

核心方法：

- `_build_error_message`：把异常构建成错误ToolMessage。
- `_maybe_stamp`：给需要的结果盖生产者绑定元数据。
- `_stamp_skill_read_metadata`：给技能读取结果盖元数据。供持久上下文采集。

## 三、它和谁协作

- 它挂在中间件链的工具执行边界上。在ToolProgressMiddleware的内层。
- ToolProgressMiddleware读它盖的deerflow_tool_meta驱动状态机。
- ToolReceiptMiddleware在它外面。回执记录的是它处理之后的状态。
- 所有工具都经过它。它是工具异常的统一出口。

## 四、重要性评级

评级：9/10。

理由：所有工具异常都经过它。没有它一个工具报错就杀死整个运行。用户体验是灾难性的。它盖的deerflow_tool_meta是下游状态机和回执体系的数据基础。影响面极广。所以给9分。