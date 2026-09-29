# SafetyDetectorConfig档案

一、这个类是干什么的

SafetyDetectorConfig是单个安全探测器的配置类。这个类描述safety_finish_reason.detectors列表里的一项。每项是一个探测器实现。探测器用类路径表示。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- use：字符串。必填。这个字段是SafetyTerminationDetector实现的类路径。例如deerflow.agents.middlewares.safety_termination_detectors:OpenAICompatibleContentFilterDetector。
- config：字典。默认值是空字典。这个字段是传给探测器类的构造参数。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

SafetyFinishReasonConfig持有这个类。SafetyFinishReasonConfig的detectors字段是这个类的列表。探测器加载方式和guardrails.provider相同。用户可以放入自定义探测器而不用改核心代码。

四、重要性评级

评级：4分。

理由：这个类只是探测器的挂载点。默认情况下用内置探测器。显式配置才需要这个类。所以重要性偏低。
