# _LoopThread档案

源码位置：backend/packages/harness/deerflow/tui/persistence.py

## 一、这个类是干什么的

_LoopThread是一个后台线程。_LoopThread跑一个单独的asyncio事件循环。

_LoopThread的存在原因是SQLAlchemy异步引擎的绑定限制。异步引擎绑定在创建它的那个事件循环上。不能每次DB操作新开一个asyncio.run。新开循环会让连接绑在一次性循环上。之后再用这些连接就会报错。

_LoopThread的解法是这样的。启动一个daemon线程。线程里创建一个事件循环。循环永远跑着。所有DB操作都用run_coroutine_threadsafe提交到这个循环上执行。

## 二、类的成员

（一）字段

- _loop：asyncio事件循环。
- _thread：daemon线程。

（二）方法

- _run：线程入口。设置事件循环。循环永远跑。
- run：把一个协程提交到循环上执行。等待结果。默认超时15秒。
- close：停止循环。用call_soon_threadsafe安全停止。

## 三、它和谁协作

（一）使用者

ThreadMetaWriter持有_LoopThread。ThreadMetaWriter的每个DB操作都通过run方法提交。

（二）构建者

build_persistence函数创建_LoopThread。close时先在循环上执行close_engine，再关闭循环。

## 四、重要性评级

评级：2分。

理由：_LoopThread只解决一个技术问题。这个问题是异步引擎的循环绑定。代码不到三十行。但它是TUI持久化能工作的前提。没有它DB操作会绑错循环。给2分。
