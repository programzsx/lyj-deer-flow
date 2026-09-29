# ReasoningEffortCapabilities档案

一、这个类是干什么的

ReasoningEffortCapabilities是一个模型接受的推理力度词汇表配置类。对应issue #5073。values是提供者自己的词汇表。按显示顺序排列。aliases把DeerFlow的通用值映射到提供者的词汇。path是值写入的位置。这个类继承自pydantic的BaseModel。extra为forbid。

二、类的成员

（一）字段

- values：字符串列表。必填。至少1项。这个字段是接受的推理力度值。按显示顺序。
- default：字符串或None。默认值是None。这个字段是调用者不选择时用的推理力度。
- aliases：字典。默认值是空字典。这个字段把DeerFlow的通用值映射到提供者值。通用值包括minimal、low、medium、high。
- path：字符串。默认值是reasoning_effort。必须匹配点分标识符模式。这个字段是值被写入的模型设置路径。例如extra_body.thinking.effort。

（二）方法

- _path_must_not_shadow_a_container：字段校验器。这个方法拒绝会替换整个容器映射的path。例如extra_body。必须写成extra_body.effort。
- _values_are_unique_tokens：字段校验器。这个方法校验每个值是合法token且不重复。
- _default_and_aliases_point_at_values：模型校验器。这个方法确保default在values里。确保aliases的键不是声明值。确保aliases的目标在values里。

三、它和谁协作

ReasoningCapabilities持有这个类。ReasoningCapabilities的effort字段的类型是这个类。模型工厂根据path把推理力度写入构造参数。

四、重要性评级

评级：6分。

理由：这个类让不同提供者的推理力度统一建模。校验器阻止了静默错配。错配会让参数到不了提供者。所以重要性中等偏上。
