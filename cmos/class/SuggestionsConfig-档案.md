# SuggestionsConfig档案

一、这个类是干什么的

SuggestionsConfig是自动追问建议的配置类。AI回答结束后可以自动生成追问建议。这个类控制这个功能要不要开。这个类还控制最多生成几条建议。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示是否在AI回答结束后生成追问建议。
- max_suggestions：整数。默认值是3。取值范围是1到5。这个字段限制生成建议的数量上限。

（二）方法

这个类没有自定义方法。模块级常量DEFAULT_MAX_SUGGESTIONS和MAX_SUGGESTIONS_LIMIT为字段提供默认值和上限。

三、它和谁协作

AppConfig持有这个类。AppConfig的suggestions字段是这个类的实例。生成追问建议的执行代码读取这个实例。

四、重要性评级

评级：4分。

理由：追问建议是前端体验功能。关闭这个功能不影响核心流程。这个类只有两个简单字段。所以重要性偏低。
