# ClarificationMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/clarification_middleware.py`

## 一、这个类是干什么的

ClarificationMiddleware拦截澄清请求并把问题呈现给用户。

模型调用`ask_clarification`工具的时候。
这个中间件会拦截这次调用。
它提取澄清问题和元数据。
格式化成用户友好的消息。
返回一个Command打断执行。
把问题呈现给用户。
然后等待用户回答。

它还处理一个问题。
提供方经常把多个工具调用打包在一起。
如果`ask_clarification`和`bash`在同一轮出现。
兄弟工具会在用户回答之前先执行。
LangChain的return_direct路由检查要求最后一个AI消息的所有工具调用都是return_direct。
混合批次会既执行兄弟工具又跳回模型。
所以在`after_model`钩子里。
中间件把同轮的兄弟工具调用全部丢弃。
只留下`ask_clarification`。

格式错误的`ask_clarification`参数落在invalid_tool_calls里。
只要还有一个有效兄弟工具留在tool_calls里。
这也算停止信号。兄弟工具同样被丢弃。

非交互渠道（比如GitHub webhook）设置`disable_clarification`。
因为澄清会让运行死路一条。
人只能靠之后的webhook投递来回复。
到那时代理的这轮早就结束了。
这种运行里澄清被转成一条"继续"的ToolMessage。
不授予权限，也不打断。

## 二、类的成员

### （一）字段

- `state_schema`：固定为ClarificationMiddlewareState。

### （二）方法

钩子方法是重点。

- `after_model`和`aafter_model`：模型响应之后。如果同轮出现了`ask_clarification`加兄弟工具。改写AI消息。让兄弟工具不执行。
- `wrap_tool_call`：同步工具钩子。拦截`ask_clarification`调用。返回打断的Command。
- `awrap_tool_call`：异步版本的同一个钩子。

核心方法：

- `_drop_parallel_non_clarification_tools`：只保留`ask_clarification`。兄弟工具被改写掉。
- `_handle_clarification`：处理澄清请求。返回打断执行的Command。
- `_handle_disabled_clarification`：被禁用时返回普通ToolMessage。运行继续而不是结束。
- `_clarification_disabled`和`_is_disabled`：判断本次运行或本次调用是否抑制澄清。
- `_normalize_options`：把工具给的选项规范化成可显示的字符串。
- `_normalize_fields`：把表单字段规范化成v2字段模式。校验是原子的。任何结构坏掉的条目让整个表单失效。
- `_normalize_bool`：把模型给的布尔值强制转换。有些模型把布尔序列化成字符串或1和0。
- `_build_human_input_payload`：构建结构化的UI载荷。旧模式保持version 1。v2表单模式带version 2。
- `_format_clarification_message`：把澄清参数格式化成用户友好的消息。
- `_is_chinese`：检查文本是否含中文。影响消息格式。
- `_stable_message_id`：构造确定性的消息id。重试的澄清调用替换而不是追加。

## 三、它和谁协作

- 它挂在中间件链的工具执行边界上。必须是最后一个。
- 它拦截的`ask_clarification`工具来自tools/builtins。
- 它打断后由LangGraph的人机循环接手。前端渲染Human Input Card。
- RunJournal会持久化隐藏的人工输入卡片回复。
- 非交互渠道的运行上下文传`disable_clarification`进来。

## 四、重要性评级

评级：9/10。

理由：澄清是人机协作的核心交互。这个中间件处理了同轮兄弟工具的执行顺序问题。处理了v1和v2载荷的前端兼容。处理了非交互渠道的死路问题。它错了用户就收不到问题或运行会乱。所以给9分。