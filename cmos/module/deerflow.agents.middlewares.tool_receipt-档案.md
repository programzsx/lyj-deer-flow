# deerflow.agents.middlewares.tool_receipt-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_receipt.py。

## 一、这个模块是干什么的

这个模块不是中间件。

这个模块是确定性工具回执的核心库。

每个工具结果都会得到一张回执。

回执由ToolReceiptMiddleware打进additional_kwargs。

回执是零LLM的验证层。

回执不需要模型参与。

回执记录工具调用的确定事实。

事实包括工具名。

事实包括调用状态。

事实包括参数和输出的哈希。

事实包括字节数和时间戳。

回执从消息流派生。

回执从不单独存储。

这样给模型的渲染和给父智能体的采集总是一致。

模型在最终报告里可以引用回执id。

父智能体验证引用。

一句话总结。

模型说"我做过什么"。

回执证明"确实做过"。

### 1、这个模块的三个关键说明

第一个是分层契约。

工具回执是每次工具调用的不可变事实记录。

回执由消息承载。

回执区别于运行层的run delivery事件。

run delivery事件每次运行一条。

事件由事件库承载。

两层只共享verdict结构约定。

verdict结构是source加requirement加详情。

satisfied布尔只属于运行层硬门。

咨询层用中性词汇。

中性词汇包括citation_resolved和supported。

模型不会把证据混同成验收。

第二个是新鲜度说明。

回执捕获执行时刻的事实。

原始工具返回在消毒和截断改写之前被打标。

压缩后只有消毒过的content存活。

所以output_sha256是新鲜度戳。

不是可复验的指纹。

第三个是重编号说明。

压缩和摘要会丢弃老的ToolMessage。

显示id按位置分配。

存活的回执会重新编号。

压缩前引用的[r3]压缩后可能指向另一个调用。

所以引用验证必须按引用轮次的账本解析。

不能用压缩后的账本。

## 二、模块里的主要成员

### 1、常量

TOOL_RECEIPT_KEY的值是"deerflow_tool_receipt"。

这个键存放在ToolMessage的additional_kwargs里。

TOOL_RECEIPT_LEDGER_KEY的值是"deerflow_tool_receipt_ledger"。

这个键存放在AIMessage的additional_kwargs里。

_HASH_LEN是16。

哈希用sha256的前16位。

_RENDER_CHAR_BUDGET是2000。

渲染账本的字符预算。

RECEIPT_ID_PREFIX是"r"。

_MAX_RECEIPT_ID_DIGITS是10。

模型生成的引用id在整数转换前限制位数。

### 2、回执数据结构

ToolReceipt是TypedDict。

它有八个字段。

字段一是id。

id是显示id。

字段二是tool_call_id。

字段三是tool_name。

字段四是status。

status来自deerflow_tool_meta。

字段五是args_sha256。

字段六是output_sha256。

字段七是output_bytes。

字段八是created_at。

### 3、引用格式函数

receipt_id生成第position张回执的显示id。

id从r1开始。

CITATION_RE是引用的正则。

引用格式是[r2]裸形式。

或者是[r2 write_file]带锚点形式。

锚点让验证器可以检查声明和证据的一致性。

format_citation生成规范的模型可见引用。

parse_citations从报告正文提取引用对。

返回值是id加锚点的列表。

提取按首次出现去重。

模型输出是不可信的。

位数超过10的id被跳过。

巨大的id不能触发Python的整数转换上限。

否则一个成功的task会变成验证异常。

### 4、make_tool_receipt函数

这个函数为一次调用加结果对构建回执。

它不分配显示id。

参数哈希用sort_keys序列化后取sha256。

输出哈希对content取sha256。

content是字符串就直接用。

content不是字符串就序列化成JSON。

状态优先从deerflow_tool_meta读取。

没有就回退到message.status。

### 5、extract_tool_receipts函数

这个函数按消息顺序收集打了标的回执。

它给回执分配显示id。

id按位置从r1开始编号。

回执来自持久化的检查点。

所以回执的形状要先验证。

畸形条目被跳过。

跳过而不是让渲染路径崩溃。

跳过而不是被当成运行时戳的证据。

### 6、extract_citing_turn_receipts函数

这个函数返回展示给最后一个引用轮次的账本快照。

ToolReceiptMiddleware把这个运行时拥有的快照打在每个收到账本的模型响应上。

和末端重扫工具消息不同。

这些位置显示id就是响应当时能引用的id。

即使摘要后来压缩并重新编号了历史。

提取时会验证快照的形状。

id必须匹配r加正整数的格式。

id必须严格连续。

不连续返回None。

畸形快照返回None。

这个验证支撑子智能体的终端引用验证。

### 7、is_valid_receipt函数

这个函数做持久回执的结构检查。

检查是类型检查。

不是来源检查。

六个字符串字段必须是字符串。

output_bytes必须是int且不是bool。

### 8、渲染函数

#### （1）render_tool_receipts_with_snapshot

这个函数渲染账本并返回账本里可见的回执子集。

保留的回执保持原显示id。

持久化引用轮次账本的调用方必须用这个快照。

不能用完整输入列表。

否则引用可能对着被预算省略的条目验证。

渲染格式如下。

标题是"Tool receipts (execution record)"。

第二行是引用指引。

指引说每个关于动作的声明都要引用回执id。

指引的示例从format_citation生成。

示例和验证器永远不会漂移。

第三行是证据边界声明。

回执只记录调用发生过和它的状态。

回执不验证声明的正确性。

回执不等于任务验收。

账本不超预算时全部条目进入。

超预算时保留最新的回执。

保留按时间顺序。

前面加省略标记。

渲染结果仍超预算时整个截断。

截断后保留集合清空。

#### （2）render_tool_receipts

这个函数是简化版。

它只返回渲染文本。

不返回保留子集。

## 三、它和谁协作

这个模块是纯工具模块。

它没有中间件类。

它没有LangGraph钩子。

它被ToolReceiptMiddleware调用。

ToolReceiptMiddleware用它打标和渲染。

它被验证层消费。

子智能体的终端引用验证用它解析引用。

引用验证包括extract_citing_turn_receipts和parse_citations。

它依赖tool_result_meta的TOOL_META_KEY读取状态。

回执机制和运行层delivery事件分层。

两层共享verdict结构约定。

satisfied布尔只属于运行层。

## 重要性评级

评级是7分。

理由如下。

回执机制解决了"模型声称做过什么"的可信问题。

模型会说它调用过某工具。

回执提供零LLM的确定性证明。

验证不消耗额外的模型调用。

这个模块的设计考虑很周到。

分层契约防止证据混同验收。

新鲜度和重编号两个说明都写清楚了。

引用id的位数限制防止模型输出造成异常。

账本快照支撑压缩后的引用验证。

渲染预算内的保留策略保持最新证据。

所以评级是7分。

不评更高分的理由是它是回执机制的库层。

打标和渲染的装配在ToolReceiptMiddleware里。

关闭回执功能运行仍然完整可用。
