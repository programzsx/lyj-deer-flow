# LoopDetectionConfig档案

一、这个类是干什么的

LoopDetectionConfig是重复工具调用循环检测的配置类。这个类控制检测要不要开。这个类还控制警告阈值、硬停止阈值和按工具的频率覆盖。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示是否启用重复工具调用循环检测。
- warn_threshold：整数。默认值是3。最小值是1。这个字段是相同的工具调用集合达到几次后注入警告。
- hard_limit：整数。默认值是5。最小值是1。这个字段是相同的工具调用集合达到几次后强制停止。
- window_size：整数。默认值是20。最小值是1。这个字段是每个线程追踪的近期工具调用集合数。
- max_tracked_threads：整数。默认值是100。最小值是1。这个字段是内存中保留的线程历史上限。这是遗留字段名。
- tool_freq_warn：整数。默认值是30。最小值是1。这个字段是同一工具类型调用达到几次后注入频率警告。
- tool_freq_hard_limit：整数。默认值是50。最小值是1。这个字段是同一工具类型调用达到几次后强制停止。
- tool_freq_overrides：字典。键是工具名。值是ToolFreqOverride。这个字段允许按工具覆盖频率阈值。常用于给bash这类高频工具提高阈值。

（二）方法

- validate_thresholds：模型校验器。这个方法确保硬停止不会先于警告发生。hard_limit必须大于等于warn_threshold。tool_freq_hard_limit必须大于等于tool_freq_warn。违反就报错。

三、它和谁协作

AppConfig持有这个类。AppConfig的loop_detection字段是这个类的实例。ToolFreqOverride是tool_freq_overrides的值类型。循环检测中间件读取这个实例。

四、重要性评级

评级：6分。

理由：循环检测是失控运行的主要防线。默认开启。硬停止直接决定代理会不会无限循环烧钱。所以重要性中等偏上。
