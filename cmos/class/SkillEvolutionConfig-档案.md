# SkillEvolutionConfig档案

一、这个类是干什么的

SkillEvolutionConfig是技能演化的配置类。技能演化指代理自己创建和修改技能。这个类控制代理能不能改skills/custom下的技能。这个类还控制安全审核模型和失败策略。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示代理能否在skills/custom下创建和修改技能。
- moderation_model_name：字符串或None。默认值是None。这个字段为技能安全审核指定模型。不指定就用主对话模型。
- security_fail_closed：布尔值。默认值是True。这个字段表示审核模型不可用时要不要阻止技能写入。True表示阻止。False表示允许非可执行内容带警告通过。可执行内容仍然被阻止。

（二）方法

这个类没有自定义方法。这个类只有三个字段。

三、它和谁协作

AppConfig持有这个类。AppConfig的skill_evolution字段是这个类的实例。技能演化流程读取这个实例。安全审核代码读取moderation_model_name和security_fail_closed。

四、重要性评级

评级：6分。

理由：技能演化默认关闭。但这个类和安全策略有关。security_fail_closed决定了安全兜底方向。配置错了会带来安全风险。所以重要性中等偏上。
