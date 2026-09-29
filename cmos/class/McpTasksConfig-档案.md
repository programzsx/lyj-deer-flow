# McpTasksConfig档案

一、这个类是干什么的

McpTasksConfig是MCP任务轮询器的启动配置类。这个轮询器是协议中立的。这个类控制轮询器要不要启动。这个类还控制轮询节奏、租约时长和结果大小限制。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示轮询器是否启动。
- poll_interval_seconds：整数。默认值是5。取值范围是1到300。这个字段是普通轮询的间隔秒数。
- lease_seconds：整数。默认值是120。取值范围是5到3600。这个字段是任务租约时长。
- max_concurrent_polls：整数。默认值是8。取值范围是1到64。这个字段限制并发轮询数。
- max_poll_backoff_seconds：整数。默认值是300。取值范围是1到3600。这个字段限制轮询退避的上限。
- input_required_poll_interval_seconds：整数。默认值是60。取值范围是5到3600。这个字段是等待输入任务的轮询间隔。
- tracking_degraded_after_errors：整数。默认值是3。取值范围是1到100。这个字段表示连续多少次错误后标记追踪降级。
- max_result_bytes：整数。默认值是65536。取值范围是1024到10485760。这个字段限制结果的最大字节数。
- result_preview_max_chars：整数。默认值是2000。取值范围是64到100000。这个字段限制结果预览的字符数。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的mcp_tasks字段是这个类的实例。MCP任务运行时读取这个实例来启动和控制轮询器。

四、重要性评级

评级：5分。

理由：MCP长任务是可选功能。默认关闭。但这个类的字段控制了轮询的核心行为。字段较多且互相配合。所以重要性中等。
