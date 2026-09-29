# TokenUsageConfig档案

一、这个类是干什么的

TokenUsageConfig是token用量追踪的配置类。这个类只保存一个开关。这个开关决定要不要启用token用量追踪中间件。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示是否启用token用量追踪中间件。

（二）方法

这个类没有自定义方法。这个类只靠BaseModel提供字段校验和序列化能力。

三、它和谁协作

AppConfig持有这个类。AppConfig的token_usage字段是这个类的实例。配置加载时default_factory会构造默认实例。

四、重要性评级

评级：4分。

理由：这个类只有一个开关字段。token用量追踪是辅助功能。关闭追踪不影响核心对话流程。所以重要性不高。
