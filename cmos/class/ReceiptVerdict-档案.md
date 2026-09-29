# ReceiptVerdict档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/receipt_verification.py`

## 一、这个类是干什么的

ReceiptVerdict是一次子代理报告引用核对的完整结论。

子代理的报告会引用工具回执。
引用形式是`[rN]`。也可以带工具名锚定成`[rN tool_name]`。

父代理把报告里的引用和执行记录做交叉核对。
核对结果装进ReceiptVerdict。

核对结论是建议性质的。
它不是任务验收的硬门槛。
所以用词上刻意中性。
布尔字段叫`citation_resolved`。
不用satisfied、verified、passed这种强肯定词。
强肯定词留给运行时的硬门槛。
这样模型不会把建议性的执行证据当成任务验收。

## 二、类的成员

### （一）字段

- `source`：核对结论的来源。
- `requirement`：核对针对的要求。
- `citation_resolved`：引用是否被核对上的布尔值。
- `cited`：报告里引用了的回执id列表。
- `resolved`：成功核对上的回执id列表。
- `failed`：核对失败的CitationFailure列表。
- `unknown`：报告引用了但账本里找不到的回执id列表。
- `no_citation_claims`：报告里没有任何引用主张的布尔标记。

### （二）方法

ReceiptVerdict没有定义自己的方法。

## 三、它和谁协作

- receipt_verification模块的核对函数产出它。
- ToolReceiptMiddleware盖的回执账本是它的核对依据。
- 上层把结论透传给lead代理做建议性参考。

## 四、重要性评级

评级：6/10。

理由：ReceiptVerdict是回执核对体系的结论出口。它的字段设计让引用核对完全可解释。用词分层避免了模型混淆证据与验收。它是数据类。行为在核对模块里。所以给6分。