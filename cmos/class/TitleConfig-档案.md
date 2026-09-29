# TitleConfig档案

一、这个类是干什么的

TitleConfig是自动线程标题生成的配置类。这个类控制标题生成要不要开。这个类还控制标题长度和生成模型。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示是否启用自动标题生成。
- max_words：整数。默认值是6。取值范围是1到20。这个字段是生成标题的最大词数。
- max_chars：整数。默认值是60。取值范围是10到200。这个字段是生成标题的最大字符数。
- model_name：字符串或None。默认值是None。这个字段是LLM标题生成用的模型。None表示用本地回退标题。
- prompt_template：字符串。默认值是一个生成简洁标题的模板。这个字段是LLM标题生成的提示模板。设置了model_name时使用。

（二）方法

这个类没有自定义方法。模块级还有get_title_config、set_title_config、load_title_config_from_dict、reset_title_config四个函数。这些函数管理模块级单例。reset_title_config供测试恢复默认。

三、它和谁协作

AppConfig持有这个类。AppConfig的title字段是这个类的实例。配置加载时load_title_config_from_dict写入模块级单例。标题生成代码读取这个实例。

四、重要性评级

评级：4分。

理由：标题生成是前端体验功能。关闭后线程没有自动标题。不影响核心流程。所以重要性偏低。
