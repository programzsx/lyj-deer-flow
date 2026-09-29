# AgentAssemblyObserver档案

一、这个类是干什么的

AgentAssemblyObserver是代理装配观察者的协议类。这个类是Protocol。实现这个协议的扩展可以观察每个代理装配的结果。这个类定义一个回调方法。

二、类的成员

（一）方法

- on_agent_assembled(app_store, descriptor)：同步回调。代理构建结束时调用。同步是因为构建本身就是同步的。没有循环可以await。描述必须在图被交出去之前被捕获。实现必须便宜。必须不抛异常。默认实现返回None。

三、它和谁协作

ExtensionRegistry的agent_assembly_observer方法接收实现这个协议的对象。AgentAssemblyDescriptor和ExtensionData是回调的参数类型。宿主在代理工厂末尾调用回调。

四、重要性评级

评级：5分。

理由：这个协议是装配观察的契约。同步契约要求实现便宜且不抛异常。所以重要性中等。
