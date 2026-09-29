# deerflow.runtime.events.store.jsonl-档案

## 一、这个模块是干什么的

这个文件是运行事件存储的JSONL文件实现。

每个run的事件存在一个文件里。路径是.deer-flow/threads/线程id/runs/run_id.jsonl。

所有类别都在同一个文件里。message、trace、生命周期。

这个后端适合轻量的单节点部署。

它有一个明确的单进程保证。seq计数器是进程本地的。多进程部署共享同一个目录会产生重复的或不单调的seq。多进程用db.py。

文件I/O用asyncio.to_thread放到线程池。事件循环永远不会被阻塞。

每线程的asyncio锁串行化单进程内的写入。防止JSONL行交错。

它有一个已知的取舍。list_messages必须扫描线程的全部run文件。因为多个run的消息要统一seq排序。list_events只读一个文件。这是快速路径。

## 二、模块里的主要成员

### 1、JsonlRunEventStore类

这个类继承RunEventStore。

#### （1）内部结构

_seq_counters是线程id到当前最大seq的映射。进程本地。

_write_locks是每线程的asyncio锁。用弱值字典持有。避免每个历史线程泄漏一把锁。同时不拆分活跃锁的世代。

#### （2）变更排空

_run_mutation是全部变更的公共通道。

它先拿每线程锁。然后创建一个名为jsonl-mutation:线程id的任务。执行变更。用_await_owned_task等待。

_await_owned_task让被拥有的工作保持挂载直到结束。然后再传播取消。取消to_thread只停等待者。不停文件系统worker。所以锁要穿过I/O、回滚、记账。调用方被反复取消也不能把活跃的磁盘worker甩掉。排队中的调用方可以在拿锁之前取消。不会启动变更。

#### （3）id校验

_validate_id校验id对文件系统路径安全。只接受字母数字下划线和横线。

thread_id用validate_thread_id校验。

#### （4）写入方法

put写单个事件。在_run_mutation内。加载seq计数器。分配seq。写一行JSON。

put_batch批量写。先按线程分组。每组走_write_batch_async。seq在一次锁下预留。记录按run_id分组追加到各自的文件。失败时回滚已追加的组。用truncate恢复原文件大小。多线程批次按组顺序处理。后面的失败不回滚前面的组。取消时排空当前线程组，不启动后面的组。回滚不保证多文件批次的崩溃原子性。

put_if_absent幂等写入。先读这个run的文件查存在性。同类型事件已存在就返回False。不存在就写。

_append_record_groups追加各组。一个失败时恢复所有已追加文件的原大小。回滚失败时记录错误。重试批次可能产生重复记录。

#### （5）读取方法

读取用物理换行切分。不用str.splitlines。因为U+0085、U+2028、U+2029是合法的JSON字符串内容。必须留在记录里。read_text先规范化CRLF再按LF切分。

_read_thread_events读全部run文件。按seq排序。

_read_run_events只读一个run的文件。

list_messages在全部事件上过滤category=message。然后按seq窗口切分。它会扫全部文件。这是已知取舍。

find_latest_ai_message_run_ids被重写。默认实现分页。JSONL重写成一次完整的线程日志读取。因为每个JSONL页要重扫全部run文件。这个快照任务名为jsonl-snapshot:线程id。持有每线程锁直到线程外的完整读取结束。即使调用方取消也保持。它刻意没有排空超时。释放所有权而worker还能读文件会让写入者进入本应稳定的快照。

list_events只读一个文件。支持过滤。

get_last_visible_ai_seq_by_run从后往前扫每个run文件。

count_messages在全部事件上统计。

get_message_seqs在全部消息上按身份查。最早的seq赢。找到全部后提前结束。

#### （6）删除方法

delete_by_thread读计数后删除全部文件。清空seq计数器。已排队的变更在删除后恢复执行。文件和计数器清空后线程在seq 1重新开始。

delete_by_run删除一个run的文件。

user_id在两个删除里都接受但忽略。文件按线程键控，不按用户。

## 三、它和谁协作

它继承runtime.events.store.base里的RunEventStore。

它依赖runtime.events.message_identity和store.base里的工具函数。

它依赖deerflow.utils.thread_id里的validate_thread_id。

它是轻量单节点部署的事件存储。

## 四、重要性评级

评级是6分。

理由是这个文件支撑了轻量部署的事件持久化。

它的变更排空逻辑保护了取消不破坏文件完整性。

JSONL记录边界规则和取消语义有专门的回归测试。

不评高分是因为它只适合单进程部署。多进程和多用户生产部署都用db.py。list_messages的全文件扫描也是性能取舍。
