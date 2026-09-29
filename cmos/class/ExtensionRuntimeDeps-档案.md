# ExtensionRuntimeDeps档案

一、这个类是干什么的

ExtensionRuntimeDeps是宿主能力包的数据类。网关基础设施就绪后绑定。扩展服务启动时收到这个包。这个类是frozen dataclass。

二、类的成员

（一）字段

- app_store：ExtensionData或None。默认值是None。这个字段是应用作用域的存储。
- policy：HostPolicySnapshot。默认值是默认构造。这个字段是宿主限流快照。
- session_factory：Any或None。默认值是None。这个字段是会话工厂。
- run_evidence_reader：RunEvidenceReader或None。默认值是None。这个字段是全局的运行证据读取器。
- model_invoker：ModelInvoker或None。默认值是None。这个字段是模型调用能力。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

ExtensionService的start方法接收这个类。HostPolicySnapshot、RunEvidenceReader和ModelInvoker是这个类的字段类型。宿主在网关基础设施就绪后构造这个类。

四、重要性评级

评级：6分。

理由：这个类是扩展服务获得宿主能力的载体。模型调用和证据读取都从这里注入。所以重要性中等偏上。
