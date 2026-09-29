# LoggingEnhanceConfig档案

一、这个类是干什么的

LoggingEnhanceConfig是请求追踪日志增强的设置类。追踪ID无条件发放。HTTP走TraceMiddleware。其他地方走ensure_trace_context。追踪ID总是返回在X-Trace-Id响应头里。这个类只决定日志记录要不要带追踪ID。还决定用什么格式。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示要不要把请求追踪ID打进日志记录。
- format：字面量。取值是text或json。默认值是text。这个字段是增强日志输出的格式。

（二）方法

这个类没有自定义方法。这个类只有两个字段。

三、它和谁协作

LoggingConfig持有这个类。LoggingConfig的enhance字段是这个类的实例。日志系统读取这个实例来决定输出格式。

四、重要性评级

评级：3分。

理由：这个类只影响日志输出格式。不影响追踪ID的发放。运维诊断有用但不是核心。所以重要性低。
