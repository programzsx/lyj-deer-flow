# SubagentRuntimeConfig档案

一、这个类是干什么的

SubagentRuntimeConfig是原生子代理执行的进程级配置类。这个类只影响启动行为。这个类描述所有子代理共享的准入和执行限制。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- max_running：整数。默认值是3。取值范围是1到64。这个字段限制单个网关进程内并发执行的原生子代理数。
- max_queued：整数。默认值是64。取值范围是0到10000。这个字段限制等待执行槽位的原生子代理数。
- admission_policy：字面量。取值是queue或reject。默认值是queue。这个字段决定执行池满时的行为。queue表示排队。reject表示立即拒绝。
- queue_timeout_seconds：整数。默认值是300。取值范围是1到86400。这个字段是排队子代理的最大等待时间。超时就准入失败。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的subagent_runtime字段是这个类的实例。SubagentsAppConfig的effective_subagent_concurrency函数读取max_running。子代理执行代码用这个实例控制进程容量。SubagentBatchesConfig的批次也共享这份容量。

四、重要性评级

评级：7分。

理由：这个类控制进程容量。子代理并发失控会拖垮进程。准入策略决定过载时的行为。这些是资源保护的关键。所以重要性中上。
