# deerflow.extensions.model_access档案

## 一、这个模块是干什么的

这个模块是扩展模型调用的授权和生命周期绑定层。

有模型调用授权的服务需要一个东西。需要一个宿主适配器。这个适配器负责两件事。

第一件事。管理操作员的授权配置。操作员可以在配置里给某个插件授予模型调用能力。授权声明一个角色到模型名的映射。还声明并发上限、超时、输入输出字符上限。

第二件事。把服务生命周期和模型调用能力绑定起来。服务启动时绑定调用器。服务停止时吊销调用器的句柄。

这个模块故意不导入任何模型提供商。启动时不拉进重量级依赖。

## 二、模块里的主要成员

### 1、ModelInvocationGrant类

这是操作员的授权配置。Pydantic模型。冻结且禁止额外字段。

主要字段有下面这些。

- `roles`，逻辑角色到已配置模型名的映射。至少一项。
- `max_concurrency`，最大并发。默认2。范围1到64。
- `timeout_seconds`，超时。默认60秒。上限600秒。
- `max_input_chars`，输入字符上限。默认262144。
- `max_output_chars`，输出字符上限。默认65536。

### 2、ExtensionHostAccess类

配置里`host_access`字段的模型。目前只有`model_invocation`一项授权。

### 3、ModelInvocationScope类

一个安装拥有一个预算。即使它注册多个服务。

这个类持有授权的深拷贝和一个惰性的预算。`bind(app_config)`方法构造`HostModelInvoker`。预算只在第一次绑定时创建。

### 4、ModelInvocationBudget类

这是事件循环拥有的准入控制。

- `semaphore`，一个asyncio信号量。并发上限由授权决定。
- `capacity`，准入上限是并发上限的两倍。
- `admitted`，当前准入数。
- `workers`，被放弃的受保护provider任务的强引用集合。强引用让被放弃但受保护的工作活着。

`retain`方法把provider任务加进集合。`_finished`回调在任务结束时清掉。被放弃的任务的异常被消费掉。不暴露provider的文本。

### 5、ModelInvocationService类

这是宿主适配器。把能力吊销和服务清理配对。

- `start(deps)`直接抛异常。有授权的服务必须走宿主生命周期启动。
- `start_with_host(deps, app_config)`，绑定调用器。把deps快照替换后传给真正的服务。绑定失败或宿主取消时关闭调用器。
- `stop()`，先关闭调用器吊销句柄。再停止真正的服务。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.model_invocation.HostModelInvoker`。真正的模型调用逻辑在那里。依赖是惰性的。放在bind方法里。

这个模块被`deerflow.extensions.registry`调用。registry的`service()`方法发现授权作用域时给服务包上`ModelInvocationService`。

这个模块被`deerflow.extensions.loader`调用。loader为每个安装创建`ModelInvocationScope`。

这个模块被`deerflow.extensions.gateway`调用。gateway的start_services对`ModelInvocationService`类型的实例调用`start_with_host`。

## 四、重要性评级

评级是7分。

理由。这个模块是扩展获得模型调用能力的管理层。没有它，插件直接调用模型就没有边界。并发没有上限。超时没有约束。吊销没有机制。

按安装计预算的设计很关键。一个插件注册多个服务。这些服务共享一个信号量。并发不会翻倍。准入上限是并发上限的两倍。超限直接失败。强引用让被放弃的工作不丢。

服务生命周期和调用器绑定的配对设计也很关键。服务启动失败时调用器被关闭。服务停止时句柄被吊销。排队中和执行中的调用者被取消。这防止服务停了之后还有调用在使用能力。

不到10分的原因。它只服务有模型授权的插件部署。它是管理层不是执行层。真正的调用、限额、隔离在model_invocation里。
