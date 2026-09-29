# ToolOutputSynopsis档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_output_synopsis.py`

## 一、这个类是干什么的

ToolOutputSynopsis是超大工具输出的结构化预览数据。

工具输出太大不能全放进模型上下文。
ToolOutputBudgetMiddleware把它外部化到磁盘。
留在上下文里的替换成一份紧凑摘要。

这个类就是那份摘要的数据结构。

摘要是确定性的。同样输入产出同样摘要。
摘要告诉模型输出是什么类型。有什么结构。有哪些值得注意的条目。开头长什么样。
模型凭这些判断要不要用read_file读全文。

## 二、类的成员

### （一）字段

- `kind`：输出的类型。ToolOutputKind枚举。
- `title`：摘要标题。
- `summary`：摘要行列表。
- `structure`：结构描述行列表。比如JSON的顶层键。
- `notable_items`：值得注意的条目列表。
- `sample`：开头样本。默认空字符串。

### （二）方法

ToolOutputSynopsis没有定义自己的方法。
它是纯数据。

## 三、它和谁协作

- ToolOutputBudgetMiddleware构造它。放进模型上下文。
- 它引用的文件在thread outputs下。模型用read_file读取。

## 四、重要性评级

评级：5/10。

理由：ToolOutputSynopsis是外部化机制的模型可见面。它的字段设计决定了模型能不能正确判断要不要读全文。确定性保证跨轮次稳定。它是数据类。逻辑在构造它的中间件里。所以给5分。