# ToolReceiptMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_receipt_middleware.py`

## 一、这个类是干什么的

ToolReceiptMiddleware给每个工具调用盖确定性回执。并把回执账本渲染给模型。

它是零模型调用的溯源层。

盖章发生在工具调用边界。
每张结果都被盖上工具名、状态、参数哈希、输出哈希、字节数、时间戳。
直接ToolMessage直接盖。
Command携带的每条匹配ToolMessage也盖。
包括task、present_file、view_image、tool_search的结果。

账本注入发生在模型调用边界。
账本从在飞消息派生。
追加成隐藏HumanMessage。不写回状态。

渲染模式有两种。

always模式每次模型调用都渲染账本。子代理链用这个。引用在子代理那里产出。没有账本子代理没法引用。第一层就失效了。

delegation_only模式只在消息流里有完成的子代理结果时渲染。lead链用这个。那是lead唯一需要引用上下文的地方。避免普通对话轮次的常开token税。

账本有2000字符预算。超了就保留最新的回执。按时间顺序。原始id不变。加一条旧回执省略标记。

它的位置要求是最外面的wrap_tool_call层。
守卫、审计、写门槛、进度守卫都可能短路或重建结果。
内层回执会在那些结果上漏账。

## 二、类的成员

### （一）字段

- `state_schema`：固定为AgentState。
- `render_mode`：渲染模式。always或delegation_only。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`和`awrap_tool_call`：工具调用边界。给结果盖回执。
- `wrap_model_call`和`awrap_model_call`：模型调用边界。派生账本。注入。给收到账本的响应盖引用账本快照。

核心方法：

- `_stamp`和`_stamp_message`：盖章逻辑。
- `_should_render`：判断本次是否渲染账本。
- `_inject`：把账本追加进请求。
- `_prepare_model_call`：准备模型调用。返回请求和账本回执。
- `_stamp_citing_ledger`：把账本快照盖到响应上。供引用核对按引用当时账本解析。

## 三、它和谁协作

- 它是最外面的wrap_tool_call层。在授权、审计、写门槛、进度守卫之外。
- 它盖的回执被receipt_verification消费。
- 它渲染的账本被子代理消费。引用编号从这里来。
- ToolErrorHandlingMiddleware在内层盖deerflow_tool_meta。回执读它。
- Gateway会剥掉外部消息里的委派回执和结论。

## 四、重要性评级

评级：7/10。

理由：回执体系是子代理报告可信度的地基。没有回执就没有引用核对。always和delegation_only的取舍控制了token成本。账本预算和快照盖戳解决了压缩重编号问题。它只在开启验证时生效。所以给7分。