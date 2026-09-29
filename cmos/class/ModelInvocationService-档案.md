# ModelInvocationService档案

源码位置：backend/packages/harness/deerflow/extensions/model_access.py

## 一、这个类是干什么的

ModelInvocationService是宿主适配器。

扩展注册的服务要拿到调用宿主模型的能力。这个能力通过ModelInvocationService包装后授予。

ModelInvocationService的核心职责是把能力撤销和服务清理配成对。

服务启动时通过start_with_host。start_with_host创建调用器。调用器放进替换后的deps快照。扩展拿到的是中立的调用器。扩展拿不到启动配置。

启动失败时撤销调用器。启动可能已经发起了调用。所以启动失败也要关掉调用器。

服务停止时先关闭调用器，再停服务。

ModelInvocationService的start方法直接抛RuntimeError。授权的服务必须通过宿主生命周期启动。不能直接调start。

## 二、类的成员

（一）字段

- service：被包装的扩展服务。
- scope：模型调用作用域。
- invoker：调用器。启动时创建。

（二）方法

- start：直接抛RuntimeError。授权服务必须走start_with_host。
- start_with_host：创建调用器。把调用器放进替换后的deps。启动服务。失败时关闭调用器。
- stop：先关闭调用器。再停服务。

## 三、它和谁协作

（一）创建者

ExtensionRegistry的service注册方法创建ModelInvocationService。注册时有模型调用授权才包这层。

（二）下游

HostModelInvoker由bind创建。扩展服务拿到的是中立的invoker。invoker替换deps里的model_invoker。

## 四、重要性评级

评级：5分。

理由：ModelInvocationService把能力授予和服务生命周期配对。启动失败撤销能力、停止时撤销能力，这两处配对防止扩展持有失效的模型调用能力。它是模型调用安全边界的执行层。给5分。
