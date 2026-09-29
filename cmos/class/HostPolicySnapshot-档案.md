# HostPolicySnapshot档案

一、这个类是干什么的

HostPolicySnapshot是宿主实际执行的限流快照数据类。这个类投影给扩展。窄投影代替宿主的AppConfig。暴露AppConfig会把每个扩展绑到harness的发布节奏上。这个类是frozen dataclass。

二、类的成员

（一）字段

- token_budget_enabled：布尔值。默认值是False。这个字段表示token预算控制是否启用。
- max_input_tokens：整数或None。默认值是None。这个字段是输入token的上限。
- max_output_tokens：整数或None。默认值是None。这个字段是输出token的上限。
- max_total_tokens：整数或None。默认值是None。这个字段是总token的上限。
- budget_warn_fraction：浮点数或None。默认值是None。这个字段是预算警告的比例。
- budget_hard_fraction：浮点数或None。默认值是None。这个字段是预算硬停止的比例。
- max_subagents_per_run：整数或None。默认值是None。这个字段是每次运行的子代理数上限。

每个字段都有默认。加宽这个类保持向后兼容。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

AgentBuildContext的policy字段是这个类的实例。ExtensionRuntimeDeps的policy字段也是这个类的实例。宿主从AppConfig推导快照。扩展从快照读限流。

四、重要性评级

评级：6分。

理由：这个类是扩展和宿主限流之间的边界。窄投影解耦了发布节奏。扩展适配器按它调整行为。所以重要性中等偏上。
