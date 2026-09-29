# VerificationConfig档案

一、这个类是干什么的

VerificationConfig是子代理结果校验层的配置类。校验层包含三部分。第一部分是回执台账。第二部分是验收清单。第三部分是选择性评审。这个类控制这三部分要不要开。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- receipts_enabled：布尔值。默认值是True。这个字段表示是否在每个工具结果上盖确定性工具回执。
- receipts_render_mode：字面量。取值是always或delegation_only。默认值是delegation_only。这个字段控制回执在主链上的渲染方式。子代理链始终渲染。delegation_only只在处理子代理结果时渲染。
- judge_enabled：布尔值。默认值是False。这个字段表示是否对带验收标准的已完成子代理结果做一次性小模型评审。
- judge_model_name：字符串或None。默认值是None。这个字段为评审指定模型。不指定就用父代理模型。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的verification字段是这个类的实例。子代理结果校验的中间件读取这个实例。

四、重要性评级

评级：5分。

理由：结果校验是质量增强机制。回执默认开启。评审默认关闭。关闭校验不影响主流程。所以重要性中等偏低。
