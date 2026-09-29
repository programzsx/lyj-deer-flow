# ContextSize档案

一、这个类是干什么的

ContextSize是上下文大小的规格配置类。这个类描述触发或保留参数的大小。type和value成对出现。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- type：字面量。取值是fraction、tokens或messages。这个字段是大小规格的类型。
- value：整数或浮点数。这个字段是大小规格的数值。

（二）方法

- _validate_value_range：模型校验器。这个方法拒绝会静默产生死阈值的取值范围。fraction按百分比风格写会变成永远达不到的阈值。触发器就永远不会触发。所以fraction必须在0到1之间。写0.8表示80%。不能写80。非有限浮点数是死阈值。YAML的.nan和.inf会被拒绝。tokens值必须为正。messages值必须还是整数。langchain用它们切消息列表。浮点索引会在压缩中途抛TypeError。
- to_tuple：这个方法把规格转成SummarizationMiddleware期望的元组格式。

三、它和谁协作

SummarizationConfig持有这个类。SummarizationConfig的trigger和keep字段是这个类的实例或列表。摘要中间件用to_tuple消费这个类。模块级常量DEFAULT_KEEP提供文档化的默认保留策略。

四、重要性评级

评级：6分。

理由：这个类校验摘要触发和保留的阈值。校验器阻止了静默失效的配置。摘要是上下文管理的核心环节。所以重要性中等偏上。
