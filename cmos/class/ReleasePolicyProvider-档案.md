# ReleasePolicyProvider档案

一、这个类是干什么的

ReleasePolicyProvider是发布策略提供者的协议类。这个类是runtime_checkable的Protocol。每个中间件实现这个协议来声明自己影响行为的参数。两次同样的代理运行必须执行同样的限制、提示和阈值。从外面重建这些参数要猜私有属性。猜会悄悄失效。所以每个中间件自己声明。

二、类的成员

（一）方法

- release_policy_parameters：这个方法返回本组件影响行为的参数。值必须可JSON序列化。长文本要哈希。不要内嵌。声明是身份。不是提示的拷贝。默认实现返回None。保证向后兼容。

三、它和谁协作

collect_release_policies收集实现了这个协议的中间件。canonical_hash消费声明的值。MiddlewareDescriptor的policy_parameters记录声明结果。

四、重要性评级

评级：6分。

理由：这个协议是行为指纹的基础。发布对比和回归排查靠它。声明是契约。所以重要性中等偏上。
