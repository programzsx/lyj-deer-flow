# MemoryBatchContext档案

## 一、这个类是干什么的

这个类是一个数据容器。

这个类的作用是装批次信息。

这个类回答的问题是"更新器知道这一批对话的哪些情况"。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/coordinator.py。

这个类是数据类。这个类用了`@dataclass(frozen=True)`装饰器。

这个类是不可变的。这个类一旦创建，字段就不能改。

这个类是在内存系统里使用的。

内存系统要给内存层判官送一批对话。内存层判官是MemorySignalCoordinator。送的时候，上下文信息就装在这个类里。

源文件的模块说明说得很清楚。内存层有一个判官。这个判官负责预筛选和信号分类。判官的工作对象就是一批对话。这个类就是判官收到的输入。

这个类对应的设计位置是"phase A"和"phase B"之间。更新器先收集信息。更新器把信息打包成这个类。更新器把这个类交给判官。

这个类不是判官。这个类不判断任何事情。这个类只负责带数据。

## 二、类的成员（字段、方法，各自做什么）

这个类没有任何方法。这个类只有字段。这个类是纯数据类。

下面逐个讲字段。

- `batch_text`：字符串类型。这个字段装本批次的文本。这个文本就是要被判断的对话内容。这个字段是必填的。
- `digest`：字符串类型。这个字段装本批次文本的摘要值。摘要值用来做缓存键。这个字段是必填的。
- `signals`：字符串的frozenset类型。这个字段装确定性信号集合。默认值是空集合。确定性信号是正则规则发现的信号。这个字段表示"本轮已经有确定性证据"。
- `staleness_review_enabled`：布尔类型。这个字段表示过期审查是否开启。默认值是False。
- `consolidation_enabled`：布尔类型。这个字段表示合并整理是否开启。默认值是False。这两个字段影响预筛选的资格。这两个字段开启时，跳过本批次会连带跳过维护审查。
- `bypass_watermark`：布尔类型。这个字段表示是否走紧急刷写。默认值是False。这个字段为True时，两个判官侧都没有资格。
- `judged`：布尔类型。这个字段表示是否允许判官判断。默认值是True。这个字段为False时，表示正在走关机排水路径。
- `thread_id`：可选字符串类型。这个字段装线程身份。默认值是None。
- `user_id`：可选字符串类型。这个字段装用户身份。默认值是None。
- `agent_name`：可选字符串类型。这个字段装代理名字。默认值是None。
- `trace_id`：可选字符串类型。这个字段装追踪身份。默认值是None。
- `message_count`：整数类型。这个字段装本批次的消息条数。默认值是0。

后四个身份字段主要用于审计。审计记录里能看到这批对话属于谁。

## 三、它和谁协作

这个类由MemorySignalCoordinator消费。

更新器不直接构造这个类。更新器送来的是一个普通映射。MemorySignalCoordinator的`__call__`方法负责把映射转成这个类。

转换逻辑在coordinator.py的`__call__`方法里。转换时会做类型清洗。`judged`和`bypass_watermark`会被转成布尔值。身份字段会经过`_optional_str`函数清洗。

如果调用方没有提供`digest`字段。`__call__`会用`batch_digest(batch_text)`现场算一个。

这个类构造好之后，会传给`judge`方法。

`judge`方法用这个类做三件事。

第一件事是算资格。`_prescreen_eligibility`和`_classifier_eligibility`读这个类的字段。这两个方法看`judged`、`bypass_watermark`、`signals`、`staleness_review_enabled`、`consolidation_enabled`。

第二件事是构造请求。`_prescreen_request`和`_signal_request`从这个类取字段。这两个函数构造MemoryPrescreenRequest和MemorySignalRequest。

第三件事是写审计载荷。`_prescreen_payload`和`_classifier_payload`读这个类的`digest`、`signals`、`message_count`。

## 四、重要性评级

这个类的评级是6分。

理由如下。

这个类是判官流程的标准输入。判官逻辑围绕这个类的字段展开。没有这个类，判官就没有统一的输入格式。

这个类承载了很多决策依据。`signals`字段决定预筛选的资格。`judged`和`bypass_watermark`决定两个侧的生死。这些字段是设计文档里L3、L8等不变量的数据来源。

这个类的依赖面不算最大。这个类只被MemorySignalCoordinator模块使用。更新器通过映射间接触碰这个类。删掉这个类，受影响的是coordinator.py内部的转换逻辑。受影响的还有判官方法的签名。

这个类是纯数据类。这个类没有复杂逻辑。删掉它容易，重建一个等价物也容易。所以评级给6分。这个类地位重要，但复杂度和被依赖程度都中等。
