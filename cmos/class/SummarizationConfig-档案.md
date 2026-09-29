# SummarizationConfig档案

一、这个类是干什么的

SummarizationConfig是自动对话摘要的配置类。这个类控制摘要要不要开。这个类还控制触发阈值和保留策略。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否启用自动对话摘要。
- model_name：字符串或None。默认值是None。这个字段是摘要用的模型。None表示用运行实际执行的模型。不是config.models的第一个。设置了就用那个模型生成。失败时回退到运行自己的模型。
- trigger：ContextSize或ContextSize列表或None。默认值是None。这个字段是触发摘要的阈值。任一阈值满足就运行摘要。
- keep：ContextSize实例。默认值是保留20条消息。这个字段是摘要后的上下文保留策略。
- trim_tokens_to_summarize：整数或None。默认值是4000。这个字段是准备摘要消息时的最大保留token数。null表示跳过裁剪。
- summary_prompt：字符串或None。默认值是None。这个字段是自定义的摘要提示模板。不提供就用默认的LangChain提示。
- skill_file_read_tool_names：字符串列表。默认包含read_file、read、view和cat。这个字段是被当作技能文件读取的工具名。用于把已加载技能捕获到持久skill_context频道。

（二）方法

这个类没有自定义方法。模块级还有get_summarization_config、set_summarization_config、load_summarization_config_from_dict三个函数。这些函数管理模块级单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的summarization字段是这个类的实例。ContextSize是trigger和keep字段的类型。摘要中间件读取这个实例。

四、重要性评级

评级：7分。

理由：摘要是上下文管理的核心机制。没有摘要长对话会撑爆上下文。触发和保留策略决定压缩行为。所以重要性中上。
