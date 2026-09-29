# deerflow_extension_api.contracts 档案

## 一、这个模块是干什么的

这个模块是扩展契约的"总目录"。

DeerFlow允许第三方扩展包扩展系统。扩展能贡献中间件、生命周期观察者、服务、HTTP路由。

扩展和宿主之间靠什么对接。靠这个包定义的协议和数据类型。

这个模块集中了大部分契约。任务生命周期。系统模型调用观察。中间件贡献。服务。注册表面。声明装饰器。

它的兼容性规则写在模块头。

每个Protocol方法都带默认实现。以后加方法。已发布的扩展不受影响。

每个可选数据类字段都带默认值。以后加字段。同样是增量式的。

## 二、模块里的主要成员

- `HostPolicySnapshot`。宿主实际执行的限额。投给扩展的窄投影。不暴露AppConfig。暴露AppConfig会把每个扩展钉死在宿主的发布节奏上。字段全带默认值。

- `TaskOutcome`。任务结局枚举。completed、aborted、failed。

- `TaskInfo`。一次lead或subagent执行的身份。包含任务id、运行id、线程id、种类、父任务id、agent名、是否恢复。

- `TaskLifecycleContributor`。任务生命周期的观察协议。任务开始和停止时被调用。

- `SystemOperationKind`。系统级模型调用的种类。goal、memory、title、summarization。这些调用不被中间件的模型调用钩子覆盖。所以要单独通知。

- `SystemModelRequest`和`SystemModelResult`。系统模型调用的请求和结果快照。请求的`__post_init__`把messages归一化成tuple。冻结快照要在事实上不可变。不只靠声明。

- `SystemModelCallObserver`。系统模型调用的观察协议。

- `MiddlewareContributor`。贡献中间件的协议。返回MiddlewarePlacement序列。

- `ExtensionRuntimeDeps`。宿主在基础设施就绪后绑定的能力。包含存储、策略快照、会话工厂、运行证据读取器、模型调用器。

- `ExtensionService`。扩展服务的协议。start和stop。

- `ExtensionRegistry`。注册表面。交给install()。只写、结构性、故意极简。宿主的具体注册表还带归属、回滚等宿主专属机制。那些故意不在这里。所有方法带默认实现。

- `ExtensionInstall`。每个扩展暴露的install()入口签名。

- `extension(api, name)`。装饰器。给install函数盖上它针对的API版本。可选。主要兼容机制是pip依赖。装饰器覆盖`--no-deps`安装和版本漂移的场景。把深层AttributeError变成可行动的启动诊断。

## 三、它和谁协作

它依赖同包的plugins和state模块。其余契约模块延迟引用。

宿主的扩展加载器和注册表实现这些协议。

每个扩展包的install()是这些契约的消费入口。

## 四、重要性评级

评级是7分。

理由如下。

它是扩展生态的宪法。扩展能不能独立于宿主发布。就靠这份契约的稳定。

默认实现的规则让契约演进保持增量式。这是扩展生态能不能活的关键。

它是扩展作者最常看的文件。注册表面的形状决定扩展的写法。

扣3分是因为它是类型契约。没有运行时逻辑。系统的核心行为不在这里。它定义的是接口而非实现。
