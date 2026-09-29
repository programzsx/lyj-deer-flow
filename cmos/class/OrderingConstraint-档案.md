# OrderingConstraint档案

源码位置：backend/packages/harness/deerflow/extensions/ordering.py

## 一、这个类是干什么的

OrderingConstraint是一条排序约束。

DeerFlow的中间件栈有顺序要求。某个中间件必须在另一个中间件外面。每条这样的要求用一个OrderingConstraint表示。

OrderingConstraint有三个字段。outer是外层中间件类型。inner是内层中间件类型。reason是这条约束存在的原因。

约束为什么重要。 broken invariant是这套系统里唯一的硬失败。观测缺失只会少一条日志。排序错误会产生没有错误的行为。没有错误的行为最难发现。

扩展贡献的中间件在验证运行之前合并进栈。这样贡献无法绕过约束。失败时报错会指名扩展。

OrderingConstraint是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- outer：必须是外层的中间件类型。
- inner：必须是内层的中间件类型。
- reason：约束存在的原因说明。

## 三、它和谁协作

（一）产生者

ordering.py的core_ordering_constraints函数返回宿主的约束集。延迟解析。第一次使用时才导入middleware类。

（二）消费者

ordering.py的assert_ordering消费约束。assert_ordering检查栈里每条约束。违反时抛RuntimeError。报错里带约束原因和责任扩展。

## 四、重要性评级

评级：5分。

理由：OrderingConstraint承载中间件栈的顺序不变量。它把手写的索引比较换成了声明式约束。每条约束带原因说明。这是声明式设计。它只是三字段数据类。给5分。
