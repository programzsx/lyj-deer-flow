# SystemModelCallObserver档案

一、这个类是干什么的

SystemModelCallObserver是宿主自有模型调用观察者的协议类。这个类是Protocol。有些系统模型调用没有被中间件的模型调用钩子包装。实现这个协议的扩展可以观察这些调用。这个类定义一个回调方法。

二、类的成员

（一）方法

- on_system_model_call(app_store, task_store, kind, request, result)：异步回调。系统自有模型调用前后宿主调用。kind是SystemOperationKind。request是SystemModelRequest。result是SystemModelResult。默认实现返回None。保证向后兼容。

三、它和谁协作

ExtensionRegistry的system_model_observer方法接收实现这个协议的对象。SystemOperationKind、SystemModelRequest和SystemModelResult是回调的参数类型。

四、重要性评级

评级：5分。

理由：这个协议覆盖了中间件钩子不覆盖的系统调用。扩展做全面观测需要它。所以重要性中等。
