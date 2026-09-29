# CitationFailure档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/receipt_verification.py`

## 一、这个类是干什么的

CitationFailure表示一次引用核对失败。

子代理在最终报告里用`[rN]`这样的编号引用工具回执。
父代理要核对这些引用。
核对不通的引用就记成一条CitationFailure。

每条失败带一个回执id和一个原因。
调用方可以看原因知道为什么没核对上。

这个类是TypedDict。
它是纯数据。没有任何行为。

## 二、类的成员

### （一）字段

- `id`：核对失败的回执显示编号，比如`r3`。
- `reason`：失败原因的文本说明。

### （二）方法

CitationFailure没有定义自己的方法。

## 三、它和谁协作

- ReceiptVerdict的`failed`字段持有它的列表。
- receipt_verification模块的核对函数产出它。
- 引用核对属于回执体系的第一层消费。核对是纯函数。没有IO。没有模型调用。

## 四、重要性评级

评级：4/10。

理由：CitationFailure让引用核对结果可解释。调用方凭原因字段能知道引用为什么没对上。它是小数据类。逻辑都在核对模块里。所以给4分。