# _Eligibility档案

## 一、这个类是干什么的

这个类是一个内部辅助类。

这个类是内部实现细节。外部代码不应该使用这个类。这一点从名字开头就能看出来。Python惯例里，下划线开头的名字是模块私有的。

这个类的作用是装资格判断的结果。

这个类回答的问题是"这一侧这一轮能不能判断，如果不能，为什么"。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/coordinator.py。

这个类是数据类。这个类用了`@dataclass(frozen=True)`装饰器。这个类是不可变的。

背景是这样的。MemorySignalCoordinator管理两个侧。一个侧是预筛选器。一个侧是信号分类器。每一轮判断之前，协调器要先问每一侧"你有资格吗"。问出来的答案装在这个类里。

为什么答案要带原因。因为设计要求审计。一个侧没有判断，审计记录里必须写清楚为什么。没有原因的沉默是不允许的。这个类的`reason`字段就是为此存在的。

## 二、类的成员（字段、方法，各自做什么）

这个类只有两个字段。这个类没有方法。

下面逐个讲字段。

- `eligible`：布尔类型。这个字段表示本侧这一轮是否有资格判断。True表示有资格。False表示没有资格。
- `reason`：可选字符串类型。这个字段装没有资格的原因。有资格时，这个字段是None。

这个类的用法很轻。构造时两个参数一起给。`_Eligibility(False, REASON_DISABLED)`表示"没资格，因为被禁用"。`_Eligibility(True)`表示"有资格，没有原因"。

源文件里定义了原因常量。这个类可能装的原因包括下面这些。

- `REASON_DISABLED`：值为`disabled`。这一侧被配置禁用了。
- `REASON_DRAIN`：值为`shutdown_drain`。系统正在关机排水，不允许判断。
- `REASON_EMERGENCY`：值为`emergency_flush`。走的是紧急刷写路径。
- `REASON_SIGNALS`：值为`deterministic_signals`。确定性信号已经存在，预筛选不用再判断。
- `REASON_MAINTENANCE`：值为`staleness_or_consolidation`。过期审查或合并整理开着，跳过会连累维护。
- `REASON_OVER_LIMIT`：值为`over_limit`。批次文本超过了本侧的长度上限。

## 三、它和谁协作

这个类由MemorySignalCoordinator的资格方法生产。

`_prescreen_eligibility`方法生产这个类。这个方法按固定顺序检查条件。检查顺序是设计好的。先查禁用。再查关机排水。再查紧急刷写。再查确定性信号。再查维护开关。再查长度上限。全部通过就返回`_Eligibility(True)`。

`_classifier_eligibility`方法也生产这个类。分类器的检查顺序短一些。分类器不看确定性信号，也不看维护开关。

这个类由judge方法消费。`judge`读两个侧的资格。资格决定走合并路径还是单侧路径。

资格对象还会传给`_judge_combined`方法。合并路径里，`wanted`问题清单按资格拼装。

资格对象最后传给`_consume`方法。`_consume`用资格决定skip和hints是否生效。

资格对象的`reason`最终流向`_fallback_reason`函数。这个函数把原因写进审计载荷的`fallback_reason`字段。

## 四、重要性评级

这个类的评级是4分。

理由如下。

这个类是审计体系的小零件。这个类把"能不能判"和"为什么不能"绑在一起。没有它，原因和状态就要散落在变量里。

这个类的存在直接支撑设计文档的要求。设计要求"开启的侧永远留记录"。记录里的`fallback_reason`就靠这个类的`reason`字段。

这个类是纯内部类。这个类只在coordinator.py内部流转。外部看不到它。删掉它，用一个元组也能顶替。

这个类的逻辑量极小。两个字段，没有方法。重建成本几乎为零。

综合来看。这个类有用，但很轻。地位是局部辅助。评级给4分。
