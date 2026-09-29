# deerflow.agents.middlewares.receipt_verification档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/receipt_verification.py。

## 一、这个模块是干什么的

这个模块做子代理报告引用的父侧验证。

这个模块不是一个AgentMiddleware类。

这个模块是一组纯函数。

子代理的最终报告会引用工具回执id。

引用形式是[rN]。

引用还可以带锚点，形式是[rN tool_name]。

这个模块把那些引用和执行记录交叉核对。

执行记录是从子代理自己的消息流收集的。

这个模块是RFC #4651 PR2的Layer-1消费侧。

这个模块只有纯函数。

没有IO。

没有LLM调用。

## 二、模块里的主要成员

### 1、词汇分层原则

摘要布尔值叫citation_resolved。

不叫satisfied。

不叫verified。

不叫passed。

强正面词被保留给运行时硬门。

这样模型永远不会把咨询性执行证据当成任务验收。

这个设计的原则是裁决是咨询性的。

裁决不是硬门。

### 2、零引用启发式

一个已完成报告做出行动声明却没有任何回执引用。

这是一个弱负面信号。

不是干净的交付。

启发式有三部分。

第一部分是英文动词表。

动词包括wrote、created、ran、executed、fixed、merged等。

第二部分是CJK动词表。

中文报告没有词边界。

英文列表在中文报告上永远不会触发。

所以直接匹配常见中文动词。

动词包括创建、生成、写入、删除、执行等。

第三部分是文件路径模式。

带扩展名的路径或两层以上的路径。

误报的代价是一行UNVERIFIED。

漏报的代价是假成功通过。

所以偏向敏感。

_NONTRIVIAL_REPORT_MIN_CHARS是240。

这是动词表之外的安全网。

收集到非空回执账本说明子代理确实执行了工具。

段落长度的报告一个都不引用就是UNVERIFIED。

不管语言和措辞。

简短的状态确认保持空通过。

### 3、verify_receipt_citations函数

这个函数是核心验证函数。

它把报告里的每个引用和收集的账本交叉核对。

函数先按id建索引。

然后逐个解析引用。

解析由parse_citations完成。

解析来自tool_receipt模块。

解析会去重精确的(id, anchor)对。

不是只去重id。

这样重复的相同引用保持紧凑。

每个不同的锚点声明都得到验证。

核对结果分四类。

resolved表示引用的回执存在、状态是success、锚点匹配。

failed表示回执状态不是success，或锚点不匹配。

unknown表示引用的id不在账本里。

cited表示全部引用。

no_citation_claims表示零引用加行动声明。

组合规则如下。

有引用时，没有failed也没有unknown才算citation_resolved。

没引用时，不是no_citation_claims才算citation_resolved。

### 4、ReceiptVerdict数据结构

ReceiptVerdict是TypedDict。

字段有source、requirement、citation_resolved、cited、resolved、failed、unknown、no_citation_claims。

VERDICT_SOURCE是"receipt_citations"。

VERDICT_REQUIREMENT是"cited_ids_in_execution_record"。

CitationFailure是TypedDict。

字段有id和reason。

### 5、validate_receipt_verdict函数

这个函数做持久化裁决的结构检查。

读侧什么都不信。

字典类型不对返回None。

source和requirement必须是非空字符串。

citation_resolved和no_citation_claims必须是布尔。

cited、resolved、unknown必须是字符串列表。

failed必须是CitationFailure列表。

任何字段损坏返回None。

这个函数让损坏的持久化元数据不会弄断下游。

### 6、render_citation_verdict函数

这个函数把裁决渲染成委派账本的引用段。

no_citation_claims时渲染"citations: UNVERIFIED"。

没引用时渲染空字符串。

有引用时渲染resolved、failed、unknown的数量。

渲染末尾固定带上_LIMITATION。

_LIMITATION是"execution evidence only, does not validate claim correctness"。

反自动化偏倚原则要求模型可见的裁决文本始终说明自己的边界。

## 三、它和谁协作

上游依赖tool_receipt模块。

parse_citations和ToolReceipt都来自tool_receipt。

下游是delegation_ledger。

render_citation_verdict的输出进入委派账本的引用段。

工具回执由ToolReceiptMiddleware盖章。

回执账本从消息状态派生。

validate_receipt_verdict服务于读侧重验证。

持久化的裁决值不可信。

重新验证持久化值。

忽略损坏的值。

已完成的工作被当作可复用证据。

不是验收。

子代理终止引用验证用这个模块解析id。

快照验证接受严格连续的正数原始id范围。

比如r24到r30。

不要求r1开头。

这样子代理的终止引用验证能在引用轮的证据上解析id。

即使后面的压缩删掉并重编号了工具消息。

## 重要性评级

评级是6分。

理由如下。

引用验证是委派可信度的关键一环。

子代理报告"我做完了"不等于真的做完了。

这个模块把声明和证据对齐。

纯函数设计让这个模块容易测试。

词汇分层的设计很讲究。

resolved代替verified防止模型混淆咨询证据和验收。

零引用启发式偏向敏感。

这符合"宁可多报UNVERIFIED也不放过假成功"的原则。

所以评6分。

不评更高分的原因是它是纯咨询层。

裁决不是硬门。

没有引用验证，委派仍然可以工作。

只是可信度降级。

不评更低分的原因是它是委派账本的数据来源之一。

损坏的裁决处理不好会污染下游。
