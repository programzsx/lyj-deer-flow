# SystemOperationKind档案

一、这个类是干什么的

SystemOperationKind是系统操作种类的枚举类。这个类继承自StrEnum。这个类表示宿主自有模型调用的种类。这些调用没有被中间件的模型调用钩子包装。

二、类的成员

（一）枚举值

- GOAL：值为goal。目标评估调用。
- MEMORY：值为memory。记忆提取调用。
- TITLE：值为title。标题生成调用。
- SUMMARIZATION：值为summarization。摘要调用。

（二）方法

StrEnum提供的能力。没有自定义方法。

三、它和谁协作

SystemModelCallObserver的on_system_model_call回调接收这个枚举。宿主在系统自有模型调用前后传入种类。

四、重要性评级

评级：4分。

理由：这个枚举只有四个值。是调用种类的标记。所以重要性偏低。
