# SandboxCapacityExceededError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxCapacityExceededError是一个沙箱异常类。

SandboxCapacityExceededError表示沙箱提供者没有可用容量。

具体场景是所有的沙箱副本槽位都在使用。

SandboxCapacityExceededError继承SandboxError。details里带结构化的容量信息。code、reason、replicas、retryable、retry_after_seconds都在details里。

reason字段区分两种情况。一种是被占用的容量。一种是提供者正在关闭。

重试调度由调用方控制。DeerFlow不自动重试。异常里带retry_after_seconds建议调用方等多久。

SandboxCapacityExceededError有一个CODE类常量。CODE是SANDBOX_CAPACITY_EXCEEDED。这个code进details。

## 二、类的成员

（一）类常量

- CODE：错误码字符串。SANDBOX_CAPACITY_EXCEEDED。

（二）字段

- active：活跃副本数。
- warm：预热副本数。
- reserved：预留副本数。
- replicas：副本总数。
- retry_after_seconds：建议重试等待秒数。默认5。
- reason：容量耗尽的原因。默认capacity。

## 三、它和谁协作

（一）产生者

沙箱提供者的获取路径抛它。E2B等远程提供者的容量管理抛它。

（二）消费者

运行时捕获它。运行时按调用方的重试策略处理。wait策略让轮次失败。burst策略用burst_limit。

## 四、重要性评级

评级：3分。

理由：SandboxCapacityExceededError是容量管理的标准信号。它带结构化的容量细节和建议重试时间。调用方靠它做重试决策。它声明了"不自动重试"的语义。给3分。
