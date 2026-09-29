# ToolReceipt档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_receipt.py`

## 一、这个类是干什么的

ToolReceipt是一张工具调用回执。

每次工具结果都会被盖上回执。
回执盖进additional_kwargs。由ToolReceiptMiddleware盖章。

回执是从消息流派生的。不是单独存储的。
所以模型看到的渲染和父代理收割的总是一致。

显示编号是r1到rN。按追加式消息列表的位置编号。
只要历史保持追加式。编号跨轮次稳定。

回执是不可变的事实记录。每次工具调用一条。
它和运行层的投递回执是两个东西。运行层回执每次运行一条。
两层只共享结论结构约定。

satisfied布尔只留给运行时硬门槛。
建议层用中性词汇。citation_resolved、supported。
这样模型不会把证据当成验收。

有一个新鲜度注意点。
回执在净化截断重写之前盖章。
压缩之后只有净化过的content存活。
所以output_sha256是新鲜度戳。不是可对持久化消息复检的指纹。

有一个重编号注意点。
压缩会丢掉老的ToolMessage。
显示编号按位置分配。存活回执会重编号。
压缩前引用的r3压缩后可能指向别的调用。
所以引用核对要按引用当时的账本解析。

## 二、类的成员

### （一）字段

- `id`：显示编号。比如r3。
- `tool_call_id`：provider的调用id。
- `tool_name`：工具名。
- `status`：执行状态。
- `args_sha256`：参数的哈希。
- `output_sha256`：输出的哈希。
- `output_bytes`：输出字节数。
- `created_at`：创建时间。

### （二）方法

ToolReceipt没有定义自己的方法。
它是TypedDict。纯数据。

## 三、它和谁协作

- ToolReceiptMiddleware盖章产出它。
- receipt_verification模块消费它做引用核对。
- 工具回执账本渲染给模型。子代理凭它写引用。

## 四、重要性评级

评级：6/10。

理由：ToolReceipt是零模型调用的验证层数据基础。子代理报告的可信度靠引用核对。回执是核对的依据。它的字段设计支撑了审计和核对。它是数据类。所以给6分。