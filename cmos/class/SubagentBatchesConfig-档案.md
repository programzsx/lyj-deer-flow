# SubagentBatchesConfig档案

一、这个类是干什么的

SubagentBatchesConfig是持久化原生子代理批次的配置类。这个类只影响启动行为。这个类描述批次调度器的限制和恢复设置。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示持久化批次是否启用。
- poll_interval_seconds：浮点数。默认值是1.0。取值范围是0.1到60.0。这个字段是轮询间隔秒数。
- lease_seconds：整数。默认值是120。取值范围是10到3600。这个字段是租约时长。
- max_items_per_batch：整数。默认值是5000。取值范围是1到100000。这个字段限制单批条目数上限。
- default_max_live_items：整数。默认值是100。取值范围是1到10000。这个字段是默认的存活条目上限。
- max_live_items_per_batch：整数。默认值是1000。取值范围是1到100000。这个字段是每批存活条目上限。
- default_max_running_items：整数。默认值是3。取值范围是1到64。这个字段是默认的运行条目上限。
- max_running_items_per_batch：整数。默认值是64。取值范围是1到1000。这个字段是每批运行条目上限。
- max_attempts：整数。默认值是3。取值范围是1到10。这个字段限制单条目的最大尝试次数。
- max_result_chars：整数。默认值是100000。取值范围是1000到1000000。这个字段限制结果的最大字符数。
- result_preview_max_chars：整数。默认值是2000。取值范围是64到100000。这个字段限制结果预览的字符数。

（二）方法

- validate_default_limits：模型校验器。这个方法校验默认限制不能超过对应上限。default_max_live_items不能超过max_live_items_per_batch。default_max_running_items不能超过max_running_items_per_batch。default_max_running_items不能超过default_max_live_items。result_preview_max_chars不能超过max_result_chars。违反就报错。

三、它和谁协作

AppConfig持有这个类。AppConfig的subagent_batches字段是这个类的实例。持久化批次调度器读取这个实例。SubagentRuntimeConfig为批次提供进程级执行容量。

四、重要性评级

评级：5分。

理由：持久化批次默认关闭。校验器保证了配置自洽。但这是可选功能。所以重要性中等偏低。
