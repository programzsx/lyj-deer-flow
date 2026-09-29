# ToolFreqOverride档案

一、这个类是干什么的

ToolFreqOverride是单个工具的频率阈值覆盖配置类。覆盖值可以比全局默认值高。也可以比全局默认值低。常见用法是给bash这类高频工具提高阈值。这样批量工作流不会被误判。其他工具的保护不被削弱。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- warn：整数。最小值是1。这个字段是该工具的警告阈值。
- hard_limit：整数。最小值是1。这个字段是该工具的强制停止阈值。

（二）方法

- _validate：模型校验器。这个方法确保hard_limit必须大于等于warn。违反就报错。

三、它和谁协作

LoopDetectionConfig持有这个类。LoopDetectionConfig的tool_freq_overrides字典的值类型是这个类。键是工具名。循环检测中间件按工具查找覆盖值。

四、重要性评级

评级：4分。

理由：这个类是LoopDetectionConfig的附属配置。没有它循环检测也能工作。它解决的是个别工具的误判问题。所以重要性偏低。
