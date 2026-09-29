# TaskLifecycleContributor档案

一、这个类是干什么的

TaskLifecycleContributor是任务生命周期贡献者的协议类。这个类是Protocol。实现这个协议的扩展可以观察任务的开始和结束。这个类定义两个回调方法。

二、类的成员

（一）方法

- on_task_start(app_store, task_store, info)：异步回调。任务开始时宿主调用。info是TaskInfo。默认实现返回None。
- on_task_stop(app_store, task_store, info, outcome)：异步回调。任务结束时宿主调用。outcome是TaskOutcome。默认实现返回None。

每个方法都有默认实现。加新方法对已发布的扩展保持向后兼容。

三、它和谁协作

ExtensionRegistry的task_lifecycle方法接收实现这个协议的对象。TaskInfo、TaskOutcome和ExtensionData是回调的参数类型。

四、重要性评级

评级：5分。

理由：这个协议是任务生命周期观察的契约。扩展做监控和审计靠它。所以重要性中等。
