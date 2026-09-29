# deerflow.runtime.events.store.memory-档案

## 一、这个模块是干什么的

这个文件是运行事件存储的内存实现。

run_events.backend=memory时使用它。memory是默认后端。

测试也用它。

数据存在进程内存的字典里。进程重启就没了。

它对单进程异步使用是线程安全的。同一个事件循环里的所有变更不需要线程锁。

## 二、模块里的主要成员

### 1、MemoryRunEventStore类

这个类继承RunEventStore。

#### （1）内部数据结构

它维护四个投影。

_events是线程id到seq排序事件列表的映射。这是主存储。

_messages是消息专用的投影。存的和_events是同一批字典对象，不复制。保持seq排序。消息分页用bisect定位。复杂度是对数加页大小。不用每次请求重扫全部事件。

_events_by_run和_messages_by_run是按run键控的投影。同样是同一批字典对象。单run的读取只碰这个run的事件。不用重扫整个线程。

_seq_counters是线程id到最后分配的seq的映射。

#### （2）写入方法

put写单个事件。走_put_one。

put_batch批量写。逐个调用_put_one。

put_if_absent幂等写入。查找和追加之间没有await。所以对单事件循环的并发模型是原子的。

#### （3）读取方法

list_messages用bisect在seq排序的消息投影上定位窗口。before_seq向前翻页。after_seq向后翻页。默认返回最新limit条。

list_events在run键控的投影上过滤。支持event_types、task_id、after_seq。

list_messages_by_run在run键控的消息投影上用bisect分页。

get_last_visible_ai_seq_by_run从后往前扫每个run的消息。过滤掉middleware调用者。event_type是llm.ai.response或ai_message。返回每个run的最后一条。

count_messages返回消息投影的长度。

get_message_seqs按身份查找seq。用message_identity计算身份。最早的seq赢。找到全部目标后提前结束扫描。

#### （4）删除方法

delete_by_thread清空线程的全部投影和seq计数器。user_id接受但忽略。因为内存存储没有用户列。

delete_by_run从主存储过滤掉这个run的事件。同步维护消息投影。从run键控投影里删掉这个run。返回删除数。

## 三、它和谁协作

它继承runtime.events.store.base里的RunEventStore。

它依赖runtime.events.message_identity里的message_identity。

它依赖runtime.user_context里的AUTO哨兵。

它是默认的事件存储后端。开发环境和测试用它。

## 四、重要性评级

评级是6分。

理由是这个文件是默认后端。

本地开发和全部离线测试跑在它上面。

它的投影设计保证了查询复杂度有界。

不评高分是因为它不能用于多进程生产部署。数据不持久。

它是理解其他两个实现的语义参照，但不是关键路径。
