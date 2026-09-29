# AnchorRule档案

源码位置：backend/packages/harness/deerflow/extensions/anchors.py

## 一、这个类是干什么的

AnchorRule是一条锚点定位规则。

扩展贡献的中间件要插进DeerFlow的中间件栈。插在哪里由语义位置决定。AnchorRule负责把语义位置翻译成具体的栈索引。

AnchorRule的side字段有七种取值。取值分三组。

第一组是outer和inner。outer表示插在第一个匹配类型的中间件外面。inner表示插在第一个匹配类型的中间件里面。

第二组是outer_last和inner_last。outer_last表示插在最后一个匹配类型的中间件外面。inner_last表示插在最后一个匹配类型的中间件里面。

第三组是inner_last_after。这个取值多一个条件。匹配的类型必须在after_types的最后一个中间件之后。

第四组是start和end。这两个是栈的绝对两端。忽略types。

AnchorRule是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- side：定位方向。七种取值。
- types：要匹配的中间件类型元组。
- after_types：inner_last_after模式的边界类型元组。

（二）方法

- resolve：在给定的中间件序列上解析出插入索引。找不到时返回None。

## 三、它和谁协作

（一）上层

PlacementAnchor持有AnchorRule。PlacementAnchor把多条AnchorRule组成一条回退链。

（二）匹配依据

resolve用isinstance做类型匹配。类型匹配发生在assert_ordering和组合时。那时候middleware类已经可用。

## 四、重要性评级

评级：5分。

理由：AnchorRule是语义位置到栈索引的翻译单元。这是扩展中间件放置系统的基础。没有它扩展贡献的中间件无法定位。栈重构时只需要更新锚点表。它逻辑清晰单一。给5分。
