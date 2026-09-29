# deerflow.extensions.isolation档案

## 一、这个模块是干什么的

这个模块把扩展中间件的失败和用户的运行隔离开。

扩展中间件在LangChain的调用链里执行。一个未处理的异常会中止用户的运行。这是不能接受的。所以每个贡献中间件都包上一层隔离壳。隔离壳就是`IsolatedMiddleware`。

隔离壳的逻辑是fail-open。观察失败降级成一条诊断。调用照样通过。下游的处理器照样执行。用户的运行不受影响。

这个模块还有一个关键职责。镜像内部中间件的完整接口。LangChain通过检查包装器来发现能力。钩子参与用类级身份检查。工具、state_schema、transformers用实例属性。包装器必须让LangChain看到和内部中间件一样的接口。

## 二、模块里的主要成员

### 1、IsolatedMiddleware类

这是隔离壳本体。继承LangChain的`AgentMiddleware`。

这个类不用`__init__`直接实例化。`__new__`会根据内部中间件实现了哪些钩子。动态选一个缓存的子类。子类只定义那些钩子的委托方法。

这样做的原因。LangChain用类级身份检查发现钩子参与。`m.__class__.before_model is not AgentMiddleware.before_model`这样的检查。如果包装器定义了所有钩子的委托。那LangChain会认为包装器参与了所有钩子。即使内部中间件没有实现。这会改变行为。所以每个钩子组合一个缓存的子类。子类只定义内部真正实现的钩子。

主要属性有下面这些。

- `name`，稳定的图和trace身份。格式是`extension:来源:内部名`。
- `inner`，被包装的内部中间件。给排序检查和测试用。
- `source`，这个中间件来自哪个插件。溯源映射读它。
- `tools`、`transformers`、`state_schema`，镜像内部中间件的实例属性。LangChain从包装器上读这些。state_schema必须是每实例的。因为缓存的子类会被不同schema的中间件共享。

### 2、_wrapper_subclass函数

按钩子集合构建并缓存子类。

每个钩子集合一个子类。不是每个中间件一个。实现相同钩子组合的内部中间件共享一个子类。

子类还会补上wrap钩子的静默透传副本。LangChain把每个同步/异步wrap对当成一个能力。内部只实现了一边时。LangChain会把两条执行路径都接上。没有透传副本基类会抛NotImplementedError。隔离就来不及fail-open了。

### 3、_invoke_sync和_invoke_async函数

这是wrap钩子的核心隔离逻辑。

它用一个跟踪处理器包住下游handler。跟踪处理器记录handler是否被调用、是否成功、结果是什么、错误是什么。还记录handler是否被调用了多次。

然后调用内部中间件的钩子。异常处理分三类。

- handler自己的错误。归图的错误策略管。原样抛出。
- 内部中间件在handler之前失败。调用handler一次。让调用通过。
- 内部中间件在handler之后失败。返回已捕获的handler结果。不重复调用。

`GraphBubbleUp`是LangGraph的控制流异常。比如中断、跳转。单独处理。防止被错误地当成失败。

### 4、生命周期钩子的隔离

生命周期钩子没有handler可以透传。失败时的fail-open降级是不应用任何状态更新。返回None。

### 5、graph_safe_middleware_name函数

把中间件身份规范化成LangGraph节点名安全的字符串。不安全字符替换成下划线。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.loader.Diagnostic`。失败时构造诊断。

这个模块被`deerflow.extensions.injection`调用。注入过程用IsolatedMiddleware包装每个贡献中间件。

这个模块被`deerflow.extensions.ordering`引用。排序检查读取`.inner`属性。绕过隔离壳检查真实类型。

这个模块被`deerflow.agents.assembly_descriptor`使用。描述器解包`.inner`并读取`.source`。

## 四、重要性评级

评级是9分。

理由。这个模块直接保护用户的运行不被插件破坏。没有隔离壳。一个插件的中间件抛异常。整个用户的运行就中止了。这是扩展系统的安全底线。

镜像接口的设计非常关键。LangChain的能力发现机制决定了包装器必须精确镜像内部接口。多一个钩子改变行为。少一个钩子在基类抛NotImplementedError。单边wrap对需要透传副本。这些细节让隔离壳在功能上对LangChain完全透明。

跟踪handler的设计也很关键。隔离恢复不能引入额外的副作用。pre-handler失败调用handler一次。post-handler失败返回捕获结果。重复调用被检测。这保证隔离本身不产生新的模型请求或工具副作用。

扣一分的原因。它只隔离中间件这一层。插件的服务、路由、模型调用各有自己的隔离机制。
