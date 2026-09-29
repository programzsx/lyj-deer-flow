# deerflow.extensions.ordering档案

## 一、这个模块是干什么的

这个模块声明中间件栈的排序不变量。

DeerFlow的中间件栈有顺序要求。比如某个中间件必须包在另一个外面。这些要求以前用手写的下标比较。这个模块用声明式的不变量替代手写比较。

这个模块解决两个问题。

第一个问题。扩展贡献的中间件在验证之前就合并进栈了。一个贡献不能溜过不变量。失败时能点名负责的扩展。

第二个问题。不变量被破坏是系统里唯一的硬失败。缺少一个观察是安静的退化。不变量被破坏产生的是没有错误信号的错误行为。所以这个模块直接抛异常。

## 二、模块里的主要成员

### 1、OrderingConstraint类

一条不变量。三个字段。

- `outer`，必须在外面的中间件类型。
- `inner`，必须在里面的中间件类型。
- `reason`，为什么有这条要求。

"外面"的意思是下标更小。LangChain的组合规则是列表第一项是最外层包装。

### 2、assert_ordering函数

这是主函数。检查不变量。违反时抛RuntimeError。

流程如下。

- 逐条检查约束。
- 对每条约束找出outer和inner在栈里的下标。查找时如果元素是`IsolatedMiddleware`就读它的`.inner`属性。绕过隔离壳检查真实类型。
- 两边都缺席时跳过。不做检查。
- outer的最大下标必须小于inner的最小下标。满足则通过。
- 违反时找出违反的元素。从溯源映射里查它们的来源。有来源就点名扩展。没有来源就说是核心中间件顺序的问题。

### 3、core_ordering_constraints函数

宿主的排序不变量。首次使用时解析。有cache。

定义的不变量有下面这些。

- `DeferredToolPromotionAuditMiddleware`必须在`SkillToolPolicyMiddleware`外面。因为它必须观察策略过滤后的tool_search Command。
- `ToolProgressMiddleware`必须在`ToolErrorHandlingMiddleware`外面。因为它读取后者盖的deerflow_tool_meta戳。
- `ToolReceiptMiddleware`必须在`ToolErrorHandlingMiddleware`外面。同样的原因。
- `ToolReceiptMiddleware`必须在五个短路型中间件外面。这五个是ArtifactResolution、Guardrail、SandboxAudit、ReadBeforeWrite、ToolProgress。它们可以不调用handler直接返回或重建ToolMessage。Receipt必须包住它们。否则那些结果永远拿不到回执。账本会静默缺行。
- `ArtifactResolutionMiddleware`必须在四个参数敏感的策略外面。这四个是Guardrail、SandboxAudit、ReadBeforeWrite、ToolProgress。因为artifact句柄必须先解析。

### 4、延迟导入的设计

这个函数延迟导入中间件类型。

延迟的原因是依赖方向。`extensions/`是中间件层调用的层。在这里模块级导入`agents.middlewares`会把依赖指向反方向。中间件一导入extensions下的东西就闭环了。

解析发生在assert_ordering调用时。那时已经在中间件构建器里面了。

### 5、惰性解析的教训

这个函数的docstring记录了一个教训。前任实现用一个tuple子类延迟。子类只覆盖`__iter__`。tuple不能在构造后填充自己的存储。所以读存储的每个操作（len、bool、in、索引、切片、reversed、等于）都报告空序列。只有迭代返回真实的约束。延迟调用本身而不是伪造值。这样才保证一个答案。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.isolation.IsolatedMiddleware`。查找时解包隔离壳。

这个模块被`deerflow.extensions.stack.compose_with_extensions`调用。组合完成后验证栈。

这个模块延迟依赖`deerflow.agents.middlewares`里的各中间件类型和`deerflow.guardrails.middleware`。

## 四、重要性评级

评级是8分。

理由。这个模块是中间件栈正确性的守门员。栈顺序错了。行为就错了。而且没有错误信号。比如Receipt中间件被插到一个短路型中间件里面。那些工具结果永远没有回执。账本静默缺行。这类问题运行时不报错。只有这个模块能抓住。

声明式不变量加溯源点名的设计很关键。违反不变量时错误信息带原因。带负责的扩展名字。贡献不能溜过不变量。

延迟导入的设计解决了依赖方向问题。这个模块处在扩展层。扩展层被中间件层调用。模块级导入会闭环。

扣两分的原因。代码量小。只在代理构建时运行一次。它是验证者不是执行者。栈本身在别处构建。
