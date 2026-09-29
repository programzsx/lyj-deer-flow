# RunStartupError档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

RunStartupError是一个异常类。

RunStartupError表示durable启动无法安全解决。

触发场景有两种。

第一种是try_start发现运行ID未知。内存注册表里没有这个运行。抛出RunStartupError。

第二种是store的start_run调用失败。存储层无法确认pending到running的转换。抛出RunStartupError。原因链保留原始异常。

这个异常和RunStartOutcome是互补的。启动的结果要么是枚举值started或cancelled。要么是这个异常。异常表示不能确定安全结果的路径。

调用方捕获后通常调用fail_start_if_pending把运行标记为error。因为worker任务没有启动。运行不能留在pending状态。

## 二、类的成员

（一）继承关系

RunStartupError继承RuntimeError。

（二）字段

RunStartupError没有自定义字段。异常消息由RunManager构造。

（三）方法

RunStartupError没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager的try_start抛出RunStartupError。store启动失败时用`from exc`保留原因链。

（二）worker层

worker层和Gateway服务层捕获这个异常。捕获后调用fail_start_if_pending收尾运行。

## 四、重要性评级

评级：2分。

理由：RunStartupError是启动失败路径的信号。它让worker知道durable启动没有成功。避免运行卡在pending状态。触发场景少。代码量小。所以给2分。
