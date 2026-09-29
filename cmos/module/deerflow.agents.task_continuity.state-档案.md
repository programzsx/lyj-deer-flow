# 模块档案：deerflow.agents.task_continuity.state

## 一、这个模块是干什么的

这个模块是任务连续性的状态层。

这个模块做什么。

这个模块归一化和校验checkpoint里的连续性元数据。

这个模块还提供模型工作笔记的合并通道。

任务连续性在checkpoint状态里有两种数据。

第一种是`task_history`。

这种数据记录归档批次ID列表。

第二种是`task_notes`。

这种数据是模型的工作笔记。

这两种数据都可能从checkpoint里读出来。

也可能被外部写入。

checkpoint数据是不可信的。

外部写入也是不可信的。

Overwrite和直接集成可以绕过reducer。

所以每次读都要重新校验。

这个模块的职责就是"在任何读方使用之前，先校验和定界持久化的数据"。

这个模块的一句话总结写在docstring里。

归一化checkpoint连续性元数据。

笔记保持为模型报告。

"笔记保持为模型报告"的意思是笔记内容永远被标上`authority: model_report`。

笔记永远是模型自己写的。

笔记永远不是被验证的事实。

这个标记防止下游把模型笔记当成真相。

## （一）模块里的主要成员

### 1、边界常量

`MAX_NOTES`等于`8`。

最多`8`个工作笔记键。

`MAX_NOTE_CHARS`等于`750`。

每个笔记内容最多`750`个字符。

`MAX_NOTE_SOURCES`等于`4`。

每个笔记最多引用`4`个源ID。

`NOTE_KEY_PATTERN`是笔记键的正则。

正则是`[a-zA-Z0-9_-]{1,40}`。

键只能是ASCII字母、数字、下划线、连字符。

最多`40`个字符。

`SOURCE_ID_PATTERN`是源ID的正则。

正则是`r[a-f0-9]{32}`。

源ID是`r`加32个十六进制字符。

这和归档层的源ID生成规则对应。

`BATCH_ID_PATTERN`是批次ID的正则。

正则是`[a-f0-9]{64}`。

批次ID是64个十六进制字符。

这就是SHA-256哈希的十六进制形式。

### 2、`normalize_task_history`函数

这个函数在读者使用之前定界和校验持久化的历史。

这个函数处理五种输入情况。

第一种是`value`为`None`。

或者是空字典。

这种情况返回空字典。

第二种是`value`不是字典。

这种情况返回"不可用"的默认结构。

返回字典带`batches`空列表、`omitted_records`为0、`status`为`unavailable`。

第三种情况是逐字段校验。

`scope`字段。

scope非`None`时必须是字符串且非空。

否则scope置`None`，invalid置真。

`batches`字段。

batches必须是列表。

否则置空列表，invalid置真。

有效批次只取最后`64`个。

每个必须是字符串且匹配`BATCH_ID_PATTERN`。

有效数量和原数量不一致就invalid置真。

有效批次存在但scope是`None`。

这种情况批次清空，invalid置真。

没有scope的批次列表没有意义。

`omitted_records`字段。

类型必须是int且不小于0。

`type(omitted) is not int`是严格类型检查。

bool不是int的这个检查会拒绝布尔值。

否则置0，invalid置真。

`status`字段。

status必须是`available`或`unavailable`之一。

否则invalid置真。

返回值做三件事。

第一件是有scope就带上scope。

第二件是批次去重。

去重用`dict.fromkeys`。

去重保持顺序。

第三件是invalid时status强制变成`unavailable`。

这个函数的设计意图分三点。

第一点是合法引用保留给诊断。

第二点是畸形历史标记为不可用。

第三点是scope授权和物理源可用性仍是归档层的职责。

这个函数只做语法校验。

不做授权。

不做物理存在性检查。

### 3、`normalize_task_notes`函数

这个函数丢弃畸形条目。

这个函数规范化不可信的笔记但不认可它们。

这个函数在两个时机被使用。

第一个时机是外部checkpoint写入之前。

第二个时机是读存储状态的时候。

两个时机都要用的原因是Overwrite和直接集成可以绕过reducer。

绕过reducer的写入不会经过校验。

所以读的时候再校验一遍。

这个函数的处理规则分几条。

输入不是字典就返回空字典。

逐条校验。

键必须是字符串。

键必须匹配`NOTE_KEY_PATTERN`。

值必须是字典。

content必须是字符串。

content非空。

content不超过`MAX_NOTE_CHARS`。

`source_ids`必须是列表。

`source_ids`不超过`MAX_NOTE_SOURCES`。

每个源ID必须是字符串且匹配`SOURCE_ID_PATTERN`。

任何一条不满足就整条丢弃。

通过校验的笔记被重写成规范形状。

重写后的字典只带三个字段。

字段是content、source_ids、authority。

authority固定是`"model_report"`。

重写的原因是外部写入可能带额外字段。

重写丢弃额外字段。

笔记数量超过`MAX_NOTES`就淘汰最早的键。

淘汰用`next(iter(notes))`。

字典保持插入序。

最早的键先被淘汰。

这里有一个职责边界。

源ID在这里只做语法检查。

源ID的可用性由task_note工具检查。

这个函数不查源是否真的存在。

### 4、`merge_task_notes`函数

这个函数是笔记通道的reducer。

LangGraph状态更新用reducer合并新旧值。

这个函数先归一化左值。

左值是已有状态。

然后逐条处理右值。

右值是本次写入。

右值不是字典就当空字典。

值为`None`表示删除这个键。

删除用`merged.pop(key, None)`。

值非`None`就先归一化再更新。

单条归一化保证写入也过校验。

最后把合并结果截尾到`MAX_NOTES`。

截尾的理由写在注释里。

工具在容量处拒绝新键。

外部提供的状态也要定界。

也就是说外部写入可能塞进超过8条。

reducer截尾保证状态里永远最多8条。

### 5、`TaskNotesChannel`类

这个类继承`BinaryOperatorAggregate[dict | None]`。

这是LangGraph的二值聚合通道。

这个类覆盖`update`方法。

`update`在校验每次checkpoint写入时被调用。

包括首次写入和Overwrite。

覆盖逻辑分两步。

第一步调用父类的`update`。

父类更新聚合值。

返回值表示是否有变化。

第二步有变化就用`normalize_task_notes`清洗值。

这样设计的原因是`BinaryOperatorAggregate`本身只做聚合。

它不校验内容。

Overwrite写入绕过reducer但会触发channel的update。

所以校验放在channel层。

这个类还有一个设计意图。

通道在收到第一次写入之前保持未初始化。

未初始化的意义是功能关闭时不往普通状态和SSE快照里加notebook。

如果通道一上来就初始化一个空字典。

所有快照都会多一个空字段。

快照对比和SSE事件都会受影响。

## （二）它和谁协作

### 1、它依赖谁

它依赖`langgraph.channels.BinaryOperatorAggregate`。

这是笔记通道的基类。

它依赖标准库的`re`和`collections.abc.Sequence`。

它没有依赖归档层。

这个模块和归档层是平级的。

两层只通过正则模式对应。

`SOURCE_ID_PATTERN`对应归档层的源ID格式。

`BATCH_ID_PATTERN`对应归档层的批次ID格式。

### 2、谁调用它

`archive.py`的`reachable`和`lookup`调用`normalize_task_history`。

这两个函数在读取批次列表前先归一化。

`archive.py`的`capture`也调用`normalize_task_history`。

`tools.py`的`_task_note`调用`normalize_task_notes`。

`tools.py`还导入`MAX_NOTES`、`MAX_NOTE_CHARS`、`MAX_NOTE_SOURCES`、`NOTE_KEY_PATTERN`、`SOURCE_ID_PATTERN`。

这些常量供工具做容量和格式检查。

`TaskNotesChannel`和`merge_task_notes`被thread状态定义使用。

`deerflow/agents/thread_state.py`把`task_notes`通道注册进`ThreadState`。

`backend/tests/test_task_continuity.py`覆盖这个模块的行为。

## 重要性评级

评级：6分。

理由分四点。

第一点，这个模块是连续性数据的信任边界。

checkpoint数据不可信。

外部写入不可信。

没有这个模块的校验，畸形数据会直接流进模型上下文。

第二点，`normalize_task_notes`的`authority: model_report`标记很关键。

这个标记把"模型自己写的笔记"和"被验证的事实"分开。

没有这个标记，下游可能把笔记当真相。

第三点，`TaskNotesChannel`覆盖`update`堵住了Overwrite绕过reducer的漏洞。

通道层校验是最后一道防线。

第四点，扣分的原因有三个。

第一个原因是这个模块是纯校验和定界层。

它自己不产生任何功能行为。

第二个原因是它的常量和服务边界由tools.py共享。

独立价值有限。

第三个原因是它只服务于task_continuity这一个功能。

影响范围限于本功能的正确性。
