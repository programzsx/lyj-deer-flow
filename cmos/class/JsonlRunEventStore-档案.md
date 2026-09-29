# JsonlRunEventStore-档案

## 一、这个类是干什么的

JsonlRunEventStore是runtime/events/store/jsonl.py里的类。

它继承RunEventStore。

它是JSONL文件事件存储。

每run一个jsonl文件。

线程目录是threads/{thread_id}/runs/{run_id}.jsonl。

这个类位于backend/packages/harness/deerflow/runtime/events/store/jsonl.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、写锁结构

_write_locks是weakref WeakValueDictionary。

每个历史线程一把锁。不泄漏。

不在持有者或等待者仍拥有时拆分活锁generation。

_get_write_lock取或创建。

### 2、_run_mutation方法

它在传播调用者取消前排空已准入的mutation。

取消to_thread只停止awaiter。不停文件系统worker。

线程锁保持到IO、回滚、记账完成。

即使调用者被重复取消。

排队的调用者仍能在拿锁前取消。

不启动mutation。

### 3、_await_owned_task

它保持拥有的工作附着直到结束。再传播取消。

取消时先等任务结束。

任务失败时重新抛出取消或异常。

### 4、id验证

_SAFE_ID_PATTERN是字母数字、dash、下划线。

_validate_id验证id在文件系统路径里安全。

validate_thread_id验证线程id。

### 5、seq

_seq_counters是thread_id到当前最大seq。

_compute_max_seq扫描一个线程的所有run文件。

返回当前最大seq。阻塞IO。

进程重启后恢复seq。

### 6、文件布局

_run_file是run_id.jsonl。

jsonl每行一个事件记录。

## 三、它和谁协作

- RunEventStore是基类契约。
- RunJournal写事件。
- run worker发布。
- weakref锁结构。

## 四、重要性评级

评级是6分。

理由如下。

这个类是JSONL持久事件存储。

_run_mutation的取消安全排空很精细。

弱锁结构防泄漏。

id验证防路径穿越。

seq恢复处理进程重启。

这些质量高。

扣掉4分。

扣分原因是它是单文件后端。查询能力有限。
