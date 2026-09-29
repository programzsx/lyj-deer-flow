# RunStore档案

源码位置：backend/packages/harness/deerflow/runtime/runs/store/base.py

## 一、这个类是干什么的

RunStore是运行元数据存储的抽象基类。

RunStore定义了运行持久化存储的协议。

RunStore的职责是约定存储必须提供哪些方法。RunManager依赖这个接口。换存储实现时不需要改RunManager。

已知的实现有两个。MemoryRunStore是内存字典实现。用于开发和测试。未来的RunRepository是SQLAlchemy ORM实现。

所有方法都接受可选的user_id。user_id用于用户隔离。user_id为None时不做用户过滤。这是单用户模式。

这个类是abc.ABC的子类。部分方法用@abc.abstractmethod标记。子类必须实现。部分方法有兼容默认实现。默认实现让旧实现保持源码兼容。

## 二、类的成员

（一）基础读写方法

- `put()`：写入或更新一个运行记录。抽象方法。这是幂等的快照写。
- `get()`：按run_id读取一个运行。抽象方法。带用户过滤。
- `delete()`：按run_id删除。抽象方法。
- `list_by_thread()`：按线程列运行。抽象方法。带keyset分页游标。
- `list_changed()`：按change_seq游标列出变更的运行记录。有默认实现。
- `list_pending()`和`list_inflight()`：列pending和活跃运行。抽象方法。

（二）状态更新方法

- `update_status()`：更新运行状态。抽象方法。返回False表示确认没有行被更新。旧实现可以返回None。
- `start_run()`：原子地把pending运行推进到running。抽象方法。行丢失或不再是pending时返回False。
- `update_model_name()`：更新模型名字段。抽象方法。
- `update_run_completion()`：持久化最终完成字段。抽象方法。包括token统计和消息内容。不能覆盖不同的终态。
- `update_run_progress()`：持久化运行中的快照。不改状态。默认实现是no-op。

（三）多worker所有权方法

- `update_lease()`：续租活跃运行。抽象方法。
- `renew_lease()`：续租并返回持久化取消请求。返回LeaseRenewal。默认实现包装旧的update_lease。不返回取消动作。多进程取消的存储必须重写这个方法。
- `request_cancel()`：为活跃运行持久化第一个取消动作。只更新pending或running行。返回赢的动作。
- `finalize_if_not_cancelled()`：原子地收尾活跃运行。除非取消先赢。返回StatusFinalization。
- `claim_for_takeover()`：原子地把租约过期的活跃运行标记为error。带条件的WHERE关闭竞争。抽象方法。
- `list_inflight_with_expired_lease()`：列出租约过期的活跃运行。抽象方法。

（四）原子接纳方法

- `create_thread_operation_atomic()`：原子地创建活跃线程操作。带跨进程唯一性。返回新运行字典和被claim的运行字典。默认实现兼容旧的create_run_atomic接口。
- `create_run_atomic()`：已废弃的兼容别名。只支持普通运行行。

（五）其他方法

- `list_successful_regenerate_sources()`：返回被成功重新生成取代的源运行ID。
- `list_edit_regenerate_runs()`：返回一个线程的编辑重跑尝试运行。
- `get_many_by_thread()`：批量加载选中运行。
- `delete_thread_operation()`：释放线程操作接纳。默认实现调用delete。用户感知的存储应重写。

（六）模块级辅助函数

base.py还定义了几个模块级函数。这些函数不属于这个类但服务于存储协议。

- `normalize_run_created_at_iso()`：把运行时间戳修成可解析的ISO-8601。
- `format_run_cursor_created_at()`：生成keyset游标用的UTC时间串。
- `parse_run_created_at()`：把存储的时间戳解析成UTC aware datetime。
- `run_sort_key()`：新到旧排序的全序。先按created_at再按run_id。
- `run_is_before_cursor()`：判断一条记录是否比游标更旧。

## 三、它和谁协作

（一）RunManager

RunManager是RunStore的主要依赖方。RunManager通过这个接口做所有持久化。

（二）MemoryRunStore

MemoryRunStore是这个协议的内存实现。继承RunStore。

（三）配套数据类

LeaseRenewal、StatusFinalization、EditReplayVisibility、RunIdempotencyConflict都定义在base.py。它们是这个协议的返回类型和异常。

## 四、重要性评级

评级：9分。

理由：RunStore是存储层的协议基类。RunManager和所有存储实现之间的契约全靠这个类。这个类还承载了大量并发语义。原子接纳、租约接管、取消竞态都定义在方法文档里。换存储不改上层，靠的也是这个抽象。它不是业务逻辑本身，所以不到10分。但作为契约它的地位非常高。所以给9分。
