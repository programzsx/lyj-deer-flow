# _SyncBoxAdapter-档案

## 一、这个类是干什么的

_SyncBoxAdapter是community/boxlite/provider.py里的内部类。

它把同步BoxLite Box handle适配到我们使用的async SimpleBox方法。

这个文档覆盖_SyncBoxAdapter加_run_sync_adapter。

位于backend/packages/harness/deerflow/community/boxlite/provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

runtime是BoxLite的同步runtime。

box是同步Box handle。

### 2、exec方法

它适配async exec到同步box.exec。

参数是cmd、args、env、user、timeout、cwd。

直接委托给self._box.exec。

### 3、stop方法

它停止box和runtime。

box.stop()在try里。

runtime.stop()在finally里。保证runtime也停止。

### 4、_run_sync_adapter函数

它运行sync-adapter的coroutine。不用BoxLite的async loop。

timeout为None时直接asyncio.run。

有timeout时asyncio.run加asyncio.wait_for。

## 三、它和谁协作

- BoxliteProvider构建它包装同步box。
- _EventLoopThread为BoxLite的async操作提供loop。
- 同步Sandbox契约调用exec。

## 四、重要性评级

评级是4分。

理由如下。

这个类是同步box handle到async方法的适配器。

exec直接委托。stop保证runtime也停止。

_run_sync_adapter不用BoxLite的async loop。

这些是boxlite provider的机械件。

扣掉6分。

扣分原因是它是薄适配器。逻辑量小。
