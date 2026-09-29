# ToolProgressConfig档案

一、这个类是干什么的

ToolProgressConfig是工具进度追踪中间件的配置类。这个中间件做任务级的工具调用进度追踪。这个类控制追踪要不要开。这个类还控制停滞检测和升级策略。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否启用工具进度追踪中间件。
- stagnation_threshold：整数。默认值是3。最小值是1。这个字段是连续问题调用的次数。达到次数就注入警告提示。
- warn_escalation_count：整数。默认值是2。最小值是1。这个字段是WARNED之后的额外问题次数。达到次数就升级到BLOCKED。
- inject_assessment：布尔值。默认值是True。这个字段表示是否把进度评估提示注入模型请求。
- jaccard_similarity_threshold：浮点数。默认值是0.8。取值范围是0到1。这个字段是近似重复结果检测的Jaccard相似度阈值。
- min_word_count_for_similarity：整数。默认值是10。这个字段是应用Jaccard检查的最小唯一词数。更短的内容完全跳过近似重复检测。
- exempt_tools：字符串集合。默认包含ask_clarification、write_todos、present_files和task。这个字段是排除在进度追踪之外的工具名。
- max_tracked_threads：整数。默认值是100。最小值是1。这个字段是内存中保留的线程历史上限。用LRU淘汰。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的tool_progress字段是这个类的实例。工具进度追踪中间件读取这个实例。

四、重要性评级

评级：5分。

理由：进度追踪帮助发现代理卡住的情况。默认关闭。状态机有WARNED和BLOCKED两级。但这是辅助诊断功能。所以重要性中等偏低。
