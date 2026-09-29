# deerflow.runtime.runs.store.base-档案

## 一、这个模块是干什么的

这个文件是运行元数据存储的抽象接口。

RunManager依赖这个接口。

这个接口管的是run记录本身。不是事件。事件存储是events.store.base。两者分开。

它还携带一批共享的数据类型和游标工具函数。

## 二、模块里的主要成员

### 1、共享数据类型

#### （1）EditReplayVisibility

这是编辑重放可见性规则的数据类。

它有两个集合。hidden_source_run_ids是被隐藏的源run。hidden_attempt_run_ids是被隐藏的失败尝试。

编辑重放会替换一个源run。最新的尝试还在进行或成功时，源run对客户端隐藏。

#### （2）LeaseRenewal

这是租约续约结果的数据类。

renewed表示续约是否成功。

cancel_action携带一个持久化的取消请求。取消请求传给拥有者worker。租约所有权不转移。

#### （3）StatusFinalization

这是状态终化的结果数据类。

finalized表示终化是否完成。

cancel_action在取消先赢时携带取消动作。

#### （4）RunIdempotencyConflict

这是幂等键冲突异常。

请求的进程级幂等键已经属于一个run时抛出。它携带已存在run的字典。

### 2、游标工具函数

#### （1）normalize_run_created_at_iso

这个函数让run时间戳可以被解析成ISO-8601。

Z变成+00:00。查询字符串里未编码的加号会变成空格。这个函数恢复偏移量里的加号。

#### （2）format_run_cursor_created_at

这个函数生成UTC键集游标。用Z结尾。这样加号不会被解码成空格。

#### （3）parse_run_created_at

这个函数把存储的时间戳解析成带时区的UTC时间。用于键集排序。解析失败返回最小时间。

#### （4）run_sort_key

这个函数定义最新优先的run列表的总排序。先按created_at。再按run_id。

#### （5）run_is_before_cursor

这个函数判断一个run是否比键集游标旧。用于分页。

### 3、RunStore抽象类

这是接口本体。

put写run记录。是幂等的快照写入。

get按id读run。user_id过滤。

list_by_thread按线程列run。最新优先。支持键集游标分页。

list_successful_regenerate_sources返回被成功重新生成取代的源run。实现必须检查完整的线程。不能应用常规的有界limit。

list_edit_regenerate_runs返回一个线程全部的编辑重放尝试。最旧优先。

get_many_by_thread批量加载选定的run。

update_status更新状态。返回False表示store能证明没有行被更新。轻量实现返回None表示无法报告行数。只允许从活跃状态流转。

start_run原子地把pending转成running。行缺失或不再pending时返回False。

delete删除run。

delete_thread_operation释放已准入的线程操作。默认实现退回delete。用户感知的store应该重写。清理不应依赖环境请求上下文。

update_model_name更新模型名。

update_run_completion持久化最终完成字段。包括token统计和消息数。实现不能替换不同的终态。

update_run_progress持久化运行中的进度快照。不改状态。尽力而为。

list_pending列出pending的run。

list_inflight列出pending或running的run。

aggregate_tokens_by_thread聚合线程的token用量。返回总token、按模型细分、按调用者细分。

update_lease续租活跃run。返回False表示没有行匹配。

renew_lease续约所有权并返回取消请求。默认实现包装legacy的update_lease。返回没有取消动作。支持多进程取消的store必须重写。续约和观察请求必须原子。

request_cancel持久化活跃run的第一个取消动作。只更新pending或running行。返回赢的动作。没有活跃行返回None。

finalize_if_not_cancelled原子地终化活跃run除非取消赢了。兼容默认实现是安全的。取消语义不支持时退回update_status。

claim_for_takeover原子地把租约过期的活跃run标记为error。只有租约过期超过grace_seconds的行或租约为NULL的行被更新。条件WHERE闭合了调用方过期读取和拥有者心跳续约之间的竞争。返回False的情况包括run不再是活跃状态、租约仍有效、行不存在。

list_inflight_with_expired_lease返回租约过期的活跃run。

create_thread_operation_atomic原子地创建带跨进程唯一性的活跃线程操作。默认实现保持与legacy的create_run_atomic兼容。legacy实现只支持普通run行。内部操作类型需要实现这个方法。返回新run字典和被认领的run字典列表。reject策略冲突时抛IntegrityError。

create_run_atomic是弃用的兼容别名。

## 三、它和谁协作

它被runtime.runs.store.memory里的MemoryRunStore继承。

它被runtime.runs.manager里的RunManager调用。

它被persistence层的SQL实现继承。

它依赖deerflow.utils.time里的coerce_iso。

## 四、重要性评级

评级是8分。

理由是这个文件是run元数据存储的完整契约。

多worker租约语义、取消仲裁语义、幂等准入语义全部定义在这里。

兼容默认实现让第三方store保持源代码兼容。

游标工具修复了查询字符串加号被解码成空格的问题。

不评更高分是因为它只是接口，核心竞争逻辑在实现里。
