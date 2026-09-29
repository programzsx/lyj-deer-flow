# AgentScope档案

一、这个类是干什么的

AgentScope是代理范围的Flag枚举类。这个类继承自Flag。这个类表示一个中间件对哪些代理生效。可以用位运算组合。

二、类的成员

（一）枚举值

- LEAD：主代理。
- SUBAGENT：子代理。
- BOTH：LEAD和SUBAGENT的按位组合。

（二）方法

Flag提供的位运算能力。没有自定义方法。

三、它和谁协作

MiddlewarePlacement的scope字段是这个枚举类型。默认值是BOTH。宿主按范围决定中间件进哪个代理的链。

四、重要性评级

评级：4分。

理由：这个枚举只有三个值。是范围的简单标记。所以重要性偏低。
