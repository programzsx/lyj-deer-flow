# SafetyFinishReasonConfig档案

一、这个类是干什么的

SafetyFinishReasonConfig是安全结束原因中间件的配置类。这个中间件拦截AIMessage。拦截条件是提供者发出了安全相关的结束信号。例如OpenAI的finish_reason为content_filter。此时消息仍然带着工具调用。中间件会抑制这些工具调用。这样被截断一半的参数永远不会执行。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段是中间件的总开关。
- detectors：SafetyDetectorConfig列表或None。默认值是None。None表示用内置探测器集合。内置集合覆盖OpenAI兼容的content_filter、Anthropic的refusal和Gemini的多种安全信号。提供非空列表则完全覆盖。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

AppConfig持有这个类。AppConfig的safety_finish_reason字段是这个类的实例。SafetyDetectorConfig是detectors字段的类型。SafetyFinishReasonMiddleware读取这个实例。探测器的加载器和guardrails.provider相同。

四、重要性评级

评级：6分。

理由：这个中间件防止被安全截断的参数执行。这是安全问题。默认开启。配置错误会让不完整参数溜进工具。所以重要性中等偏上。
