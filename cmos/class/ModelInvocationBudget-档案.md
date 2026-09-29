# ModelInvocationBudget档案

源码位置：backend/packages/harness/deerflow/extensions/model_access.py

## 一、这个类是干什么的

ModelInvocationBudget是模型调用的准入预算。

budget管理一次安装的并发准入。budget被这次安装的所有服务共享。budget由事件循环拥有。

budget的核心是并发信号量。信号量的容量来自授权的max_concurrency。

budget还有准入上限。上限是并发限制的两倍。准入上限在实际处理payload之前检查。超过上限直接拒绝。这样排队等待的调用不会无限堆积。

budget还保留worker任务的强引用。强引用让被放弃的、shielded的provider工作保持存活。被放弃的工作完成后被清理。异常被消费掉。异常不暴露provider的文本。

## 二、类的成员

（一）字段

- semaphore：asyncio.Semaphore。并发信号量。容量来自授权的max_concurrency。
- capacity：准入上限。两倍并发限制。
- admitted：当前准入计数。
- workers：worker任务的强引用集合。

（二）方法

- retain：保留一个worker任务的强引用。挂完成回调。
- _finished：任务完成回调。从集合里移除任务。消费未取消任务的异常。

## 三、它和谁协作

（一）创建者

ModelInvocationScope的bind方法创建budget。budget按授权的max_concurrency创建。

（二）使用者

HostModelInvoker用budget。invoke时检查准入上限。调用时获取信号量。provider任务通过retain保留。

## 四、重要性评级

评级：5分。

理由：ModelInvocationBudget是扩展模型调用的并发安全阀。没有它，一个扩展可以用无限并发打宿主的模型。准入上限的两倍设计和worker强引用是两处精细的工程。它是协调组件。给5分。
