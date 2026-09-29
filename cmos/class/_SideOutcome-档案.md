# _SideOutcome档案

## 一、这个类是干什么的

这个类是一个内部辅助类。

这个类是内部实现细节。外部代码不应该使用这个类。下划线开头的名字是模块私有的。

这个类的作用是装一个侧的判断结果。

这个类回答的问题是"这一侧这一轮给出了决定吗，还是说没有给出，为什么"。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/coordinator.py。

这个类是数据类。这个类用了`@dataclass(frozen=True)`装饰器。这个类是不可变的。

背景是这样的。协调器管两个侧。每一轮结束后，每一侧要有交代。交代分几种情况。最好的情况是给出了决定。其次是这一侧没资格判断。还有一种是发了请求但请求失败。这个类把这几种情况装在一起。

这个类为什么要带`request_failed`字段。源文件的docstring讲得很细。`request_failed`用来区分两种"没有结果"。一种是"请求根本没产生可用答案"。另一种是"提供方回答了，但对这批没有结论"。审计和影子评估把这两种当成不同的回退。这个区分必须活到这一层。

## 二、类的成员（字段、方法，各自做什么）

这个类只有两个字段。这个类没有方法。

下面逐个讲字段。

- `decision`：可选类型。这个字段装本侧的决定。决定可以是MemoryPrescreenDecision。决定也可以是MemorySignalDecision。这两种类型对应两个侧。没有决定时，这个字段是None。默认值就是None。
- `request_failed`：布尔类型。这个字段表示请求是否失败。默认值是False。这个字段为True时，表示请求发出去但没有产生可用答案。

这个类的三种典型取值。

第一种是成功。`_SideOutcome(decision=某决定)`。这一侧正常给出了结论。

第二种是无资格。`_SideOutcome()`。两个字段都是默认值。这一侧压根没参与。

第三种是请求失败。`_request_failure`函数构造`_SideOutcome(request_failed=True)`。注意这种取值里`decision`也是None。区分靠`request_failed`字段。

## 三、它和谁协作

这个类由协调器的判断方法生产。

单侧路径里，`_decide_prescreen`和`_decide_classifier`生产这个类。生产有三种可能。提供方为None时，返回空的`_SideOutcome()`。正常时，返回带决定的结果。捕到TypeSafeError时，返回`_request_failure`的产物。

合并路径里，`_judge_combined`生产这个类。合并请求整体失败时，两个侧一起拿到失败结果。

这个类由`_consume`方法消费。`_consume`读`decision`字段。预筛选的决定用来算skip。分类器的决定用来取hints。

这个类由`_fallback_reason`函数消费。这个函数看`request_failed`字段。`request_failed`为True时，审计原因写`request_failed`。否则写资格原因。

这个类由`_request_failure`函数构造。这个函数还会记一条warning日志。日志让不可达的端点立刻被看见，不用等评估报告。

## 四、重要性评级

这个类的评级是4分。

理由如下。

这个类承载了一个重要的语义区分。`request_failed`和"没有结论"是两个不同的审计群体。设计文档专门写了一条不变量讲这件事。请求失败绝不能读成"提供方答了但没用"。

这个类是协调器内部的数据总线。两个侧的判断结果都流经它。没有它，判断结果和失败原因就没有统一的容器。

这个类是纯内部类。这个类只在coordinator.py里流转。外部看不到它。

这个类的逻辑量极小。两个字段，没有方法。删掉它，用一个带两个元素的元组也能顶替。

综合来看。这个类轻，但语义上有价值。评级给4分。
