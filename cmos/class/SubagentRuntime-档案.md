# SubagentRuntime档案

源码位置：backend/packages/harness/deerflow/subagents/runtime.py

## 一、这个类是干什么的

SubagentRuntime是直接的图工厂用的显式运行时依赖。

应用入口在启动时安装等价的进程全局依赖。直接的图工厂不读全局配置。直接的图工厂显式拿到这个对象。

SubagentRuntime的职责有这些。

第一。共享原生子Agent容量。多个图可以共享一个真实的执行上限。上限是SubagentExecutionCapacity。

第二。可选的持久批处理。提供batch_repository时运行时拥有一个持久batch worker。worker要在构造图之前启动。worker要在应用关闭时停止。

第三。配置快照。提供app_config让registry、模型、工具解析都用调用者拥有的配置快照。不用全局YAML。

stop方法的设计很严谨。stop持有生命周期锁直到服务关闭完成。drain没有超时。这样已拥有的工作不能脱离这个runtime。第一个调用者取消会传播。服务失败会被链上。

## 二、类的成员

（一）字段

- config：运行时配置快照。深拷贝。
- max_total_per_run：每次运行的最大委派总数。
- app_config：调用者拥有的配置快照。默认None。
- execution_capacity：共享的执行容量控制器。
- batch_config：批处理配置。深拷贝。默认None。

（二）方法

- start：启动拥有的持久batch worker。配置了才启动。生命周期锁保护。幂等。
- stop：停止拥有的worker。先隐藏submitter。停止任务一直等到worker真正结束。取消传播。
- batch_submitter：属性。外部的submitter优先。已启动时返回拥有的服务。
- __aenter__、__aexit__：异步上下文管理器。
- from_app_config：类方法。从调用者拥有的配置快照构建显式SDK依赖。

## 三、它和谁协作

（一）创建者

直接的create_deerflow_agent调用者创建SubagentRuntime。可以显式构造。也可以用from_app_config。

（二）下游

SubagentExecutionCapacity由运行时创建。SubagentBatchService由运行时拥有。task工具和批处理工具共享一个控制器。

## 四、重要性评级

评级：7分。

理由：SubagentRuntime是直接图工厂的依赖注入入口。它让多个图共享一个真实的执行上限。它的stop方法处理了取消传播和服务失败的链式。它是协调层。给7分。
