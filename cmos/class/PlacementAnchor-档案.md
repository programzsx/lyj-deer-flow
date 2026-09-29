# PlacementAnchor档案

源码位置：backend/packages/harness/deerflow/extensions/anchors.py

## 一、这个类是干什么的

PlacementAnchor是一条锚点规则的回退链。

一个语义位置可能有多个候选插入点。PlacementAnchor把多条AnchorRule按顺序组成一条链。解析时从第一条规则开始试。第一条匹配不到就试第二条。依次往下。全部匹配不到时返回栈尾。

PlacementAnchor的resolve返回两个值。第一个是插入索引。第二个是是否用了主规则。

第二个值很重要。主规则没匹配到时调用方会报诊断。静默降级的放置会改变扩展观察到的内容。改变必须要有信号。所以主规则没匹配上要报出来。

PlacementAnchor有of类方法。of把多个PlacementAnchor的链拼接成一条更长的链。模块里还有七个快捷构造函数。outer_of、inner_of、inner_of_last、inner_of_last_after、outer_of_last、outermost、innermost。

PlacementAnchor是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- chain：AnchorRule元组。回退链。

（二）方法

- resolve：按链解析插入索引。返回（索引，是否用了主规则）。
- of：类方法。拼接多条锚点为一条链。

## 三、它和谁协作

（一）组成者

stack.py的_anchors函数为每个语义位置构建PlacementAnchor。MODEL_LOGICAL、MODEL_PHYSICAL、TOOL_VISIBLE、TOOL_RAW、STANDARD五个位置各有自己的锚点。

（二）消费者

injection.py的inject_middlewares消费PlacementAnchor。注入时解析插入索引。

## 四、重要性评级

评级：5分。

理由：PlacementAnchor是扩展中间件放置的核心机制。回退链设计让位置声明在栈结构变化时仍有弹性。used_primary_flag设计让静默降级有信号。没有它扩展的语义位置声明无法落地。给5分。
