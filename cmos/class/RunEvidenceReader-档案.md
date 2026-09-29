# RunEvidenceReader档案

一、这个类是干什么的

RunEvidenceReader是宿主绑定的运行证据读取协议类。这个类是Protocol。实现提供稳定的只读运行证据。实现绝不暴露写操作。这个类定义三个方法。

二、类的成员

（一）方法

- list_changed_runs(cursor, limit)：异步方法。返回cursor之后变更的可见运行。顺序稳定。调用方在自己的输出持久化之后才保存next_cursor。重用输入游标是有效的。可能重放条目。空页表示追平了。删除不产生墓碑。
- list_run_events(thread_id, run_id, after_seq, limit)：异步方法。返回seq大于after_seq的事件。缺失或不可见的运行返回空页。防止跨作用域的身份探测。
- get_run_status(thread_id, run_id)：异步方法。返回权威状态。不可见时返回None。

每个方法都有默认实现。抛NotImplementedError。表示宿主不提供。

三、它和谁协作

resolve_run_evidence_reader和require_run_evidence_reader从请求上解析这个协议。ExtensionRuntimeDeps的run_evidence_reader字段是这个协议的全局实例。请求作用域的reader用于用户路由。全局reader用于受信任服务。

四、重要性评级

评级：6分。

理由：这个协议是扩展读运行证据的唯一入口。作用域绑定和身份保护都靠它。所以重要性中等偏上。
