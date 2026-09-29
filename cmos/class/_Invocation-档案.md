# _Invocation档案

源码位置：backend/packages/harness/deerflow/extensions/model_invocation.py

## 一、这个类是干什么的

_Invocation是一次扩展模型调用的内部状态。

HostModelInvoker.invoke接收一次调用请求。invoke管理这次调用的生命周期。生命周期状态用_Invocation记录。

_Invocation记录三件事。

第一。acquired。是否已经拿到了并发信号量。拿到信号量后才能发起真正的模型调用。

第二。abandoned。调用方是否已经离开了。调用方离开后，provider任务还在跑。provider任务要保留自己的配额直到真正完成。

第三。provider。provider任务本身。真正的模型调用在这个任务里跑。

_Invocation是一个dataclass。_Invocation不是frozen的。状态在调用过程中不断变化。

## 二、类的成员

（一）字段

- acquired：是否已获取并发信号量。默认False。
- abandoned：调用方是否已放弃。默认False。
- provider：provider任务。默认None。

## 三、它和谁协作

（一）使用者

HostModelInvoker的invoke和_invoke方法使用_Invocation。finally块里靠acquired和provider决定何时释放配额。

（二）配额释放

finally块里的release逻辑是这样的。provider没结束时给provider挂done回调。回调里释放配额。provider已结束时立即释放。

## 四、重要性评级

评级：3分。

理由：_Invocation是模型调用生命周期的小型状态机。它保证配额释放的正确性。调用方放弃后provider任务仍要持有配额直到完成。这个正确性靠_Invocation的三个字段。它是内部辅助类。给3分。
