# _ThreadsafeSubmission档案

## 一、这个类是干什么的

_ThreadsafeSubmission是一次跨线程协程提交的记录。

平台的SDK回调经常运行在专用线程上。

回调线程要把准备工作提交到网关的事件循环。

提交过程需要保留真实的asyncio.Task。

这个类记录一次提交的全部状态。

它是模块内部辅助类。

名字以下划线开头。

它定义在base.py里。

它是Channel基类的跨线程提交设施的核心数据。

## 二、类的成员

### （一）字段

1、coroutine

要执行的协程。

2、loop

属主的事件循环。

协程在这个循环上创建任务。

3、name

提交名称。

用于日志。

4、msg_id

消息id。

用于日志。

5、reservation

入站预留。

可选。协程结束时释放。

6、completion

完成future。

concurrent.futures的Future。协程的结果或异常转写到它。

7、task

创建的asyncio.Task。

初始为None。任务在属主循环上创建后记录在这里。

8、cancel_requested

是否请求了取消。

stop()时标记。还没启动的提交会在启动点直接关闭。

## 三、它和谁协作

_ThreadsafeSubmission是渠道体系的跨线程提交记录。

它由Channel基类的_submit_threadsafe_coroutine创建。

它被_start_threadsafe_submission消费。在属主循环上创建任务。

它被_finalize_threadsafe_submission收尾。任务结束时转写结果，释放预留。

它被_close_and_drain_threadsafe_futures清理。停机时取消并等待所有在途提交。

所有依赖SDK回调线程的渠道子类都通过它提交工作。DingTalk、Slack、Telegram等渠道的回调线程都用到它。

它是模块内部类，只在base.py里定义和使用。

## 四、重要性评级

评级：4分。

理由如下。

它是跨线程提交设施的记录单元。

没有它，SDK回调线程提交的协程会丢失真实的Task句柄，停机时无法取消在途工作。

它的取消标记和完成future解决了跨线程生命周期的真实并发问题。

它只是内部记录结构，没有行为。作用范围只在Channel基类的提交设施里。所以只有4分。
