# deerflow.runtime.events.store.base-档案

## 一、这个模块是干什么的

这个文件是运行事件存储的抽象接口。

RunEventStore是统一的事件流存储接口。

消息和执行trace走同一个接口。两类内容用category字段区分。

消息类是category=message，给前端展示用。

trace类给调试和审计用。

所有实现必须保证几件事。

第一，put写进去的事件后续查询能查到。

第二，seq在同一线程内严格递增。

第三，list_messages只返回category=message的事件。

第四，list_events返回指定run的全部事件。

第五，返回的字典带完整的RunEvent信封字段。

第六，find_latest_ai_message_run_ids对每个请求的id返回最新的有效AI消息事件。空输入不做存储操作。

## 二、模块里的主要成员

### 1、IncompleteMessageRunLookupError异常类

这是RuntimeError的子类。

当store无法证明一次定向查询是完整的时候抛出。

调用方只有在普通返回之后才能把缺失的键当作"没有有效AI事件"的证据。异常之后不行。

### 2、normalize_message_ids函数

这个函数返回能参与查询的非空字符串id集合。

输入是id集合。非字符串和空字符串被过滤掉。

### 3、match_ai_message_run_id函数

这个函数判断一个事件是否匹配目标AI消息。

匹配条件有四个。

事件是字典。category是message。content是字典且type是ai。run_id是非空字符串且消息id在目标集合里。

匹配成功返回消息id和run_id的元组。不匹配返回None。

### 4、RunEventStore抽象类

这是接口本体。

抽象方法有这些。

put写单个事件。自动分配seq。返回完整记录。

put_batch批量写事件。RunJournal的flush缓冲用它。每个字典的键对应put的关键字参数。

put_if_absent写一个事件，除非这个run已经有同类型事件。检查和写入必须串行化。这是终态回执的持久化原语。worker崩溃后的恢复路径可以安全重试。

list_messages返回线程的可展示消息。按seq升序。支持双向游标分页。before_seq向前翻页。after_seq向后翻页。都不传返回最新的limit条。

find_latest_ai_message_run_ids把目标消息id映射到最新有效AI事件的run_id。这是有默认实现的非抽象方法。默认实现从后往前按1000行的窗口分页。整页没有安全的递进seq游标时抛IncompleteMessageRunLookupError而不是返回部分结果。调用方只有普通返回才能当作穷尽查询。

list_events返回单个run的完整事件流。支持event_types和task_id过滤。after_seq是前向游标。这样单个子代理任务的事件分页不会被run级别的limit截断。这是编号3779的修复。

list_messages_by_run返回单个run的可展示消息。同样支持双向游标分页。

get_last_visible_ai_seq_by_run返回每个run的最后一条非中间件AI消息序号。

count_messages统计线程的可展示消息数。

get_message_seqs返回已持久化消息的身份到seq的映射。检查点不带seq。摘要会丢消息。客户端合并时需要这个映射。这是编号4666的修复。一个身份对应多行时最早的seq赢。消息重持久化后保留第一次占据的位置。

delete_by_thread删除线程的全部事件。返回删除数。user_id遵循三态约定。AUTO解析调用方上下文。显式id限定删除范围。None删除所有者的行。非用户隔离的存储接受参数但忽略它。

delete_by_run删除单个run的事件。同样遵循三态约定。

## 三、它和谁协作

它依赖runtime.user_context里的AUTO和_AutoSentinel。

它被三个实现继承。memory.py、db.py、jsonl.py。

它被runtime.runs.manager调用。manager用put_if_absent写投递回执。

它被runtime.journal里的RunJournal调用。

它被runtime.runs.worker调用。

它被workspace_changes和subagent的事件生产方调用。

## 四、重要性评级

评级是9分。

理由是这个文件是全部事件存储的契约。

三个存储实现的语义一致性靠它约束。

find_latest_ai_message_run_ids的完整或出错契约保护了重新生成路径的正确性。

游标分页语义、user_id三态约定都定义在这里。

删掉它，消息展示、审计、重新生成、投递回执全部失去接口。

不评10分是因为它本身不含实现，没有实现它无法独立运转。
