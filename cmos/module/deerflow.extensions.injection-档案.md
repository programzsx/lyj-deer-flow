# deerflow.extensions.injection档案

## 一、这个模块是干什么的

这个模块把扩展贡献的中间件合并进宿主的中间件栈。

插件可以贡献LangChain的AgentMiddleware。这些中间件要插进DeerFlow的中间件栈里才能生效。这个模块负责这个插入过程。

这个模块做三件事。

第一件事。收集。把每个插件的contribute_middlewares调用一遍。收集所有贡献。

第二件事。校验。每个贡献要过五道校验。必须是`MiddlewarePlacement`。作用域必须是`AgentScope`。位置必须是`Placement`。顺序必须是int。中间件必须是`AgentMiddleware`。校验不过记录诊断跳过。

第三件事。插入。把通过校验的贡献按声明的order排序。按语义位置解析出插入下标。从后往前插入。插入的中间件都包上`IsolatedMiddleware`隔离壳。

## 二、模块里的主要成员

### 1、inject_middlewares函数

这是主函数。接收宿主中间件栈、锚点表、代理作用域、构建上下文、扩展快照。

返回三个东西。合并后的栈。一个溯源映射。从最终下标到插件来源。核心中间件不在映射里。还有构建诊断列表。

### 2、插入的顺序策略

插入顺序是刻意设计的。

先按声明的order排序。同order按注册顺序。这个结果是可复现的。

先插最内层的位置。每次插入都会移动它后面所有元素的下标。从后往前插让早先的锚点保持有效。

同一个目标下标可能有多个贡献。插入总是把上一个占位者往外推。要让优先级高的贡献最后停在最外层。它必须是最后一个插到那个下标的。所以按（下标，优先级）降序处理。

### 3、命名冲突的处理

LangChain要求中间件名字在整个栈里唯一。名字被用作trace身份和LangGraph节点ID。

贡献中间件的名字格式是`extension:来源:内部名:序号`。先经过`graph_safe_middleware_name`规范化。不安全字符替换成下划线。重名时加后缀`_2`、`_3`。

### 4、锚点降级警告

锚点解析返回是否用了主规则。没用主规则说明主锚点中间件不在这个栈里。此时报告一条warning诊断。因为位置降级可能改变插件观察到的语义。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.registry.LoadedExtensions`。它读取快照里的`middleware_contributors`。

这个模块依赖`deerflow.extensions.anchors.PlacementAnchor`。它调用锚点解析插入下标。

这个模块依赖`deerflow.extensions.isolation.IsolatedMiddleware`和`graph_safe_middleware_name`。插入的中间件都包上隔离壳。

这个模块被`deerflow.extensions.stack.compose_with_extensions`调用。stack是唯一的组合入口。

## 四、重要性评级

评级是7分。

理由。这个模块是扩展中间件进入运行栈的唯一通道。没有它，插件贡献的中间件就停留在登记处，永远不会生效。

插入顺序的策略设计很关键。从后往前插入保证锚点有效性。同下标的优先级决胜保证结果可复现。名字去重保证LangChain的trace身份不冲突。锚点降级警告保证位置语义变化可见。

校验失败fail-open的设计也重要。一个插件贡献了一个非法对象。这个贡献被跳过。其他贡献和宿主栈不受影响。

不到10分的原因。它只处理中间件这一种贡献。路由和服务走别的模块。它依赖anchors和isolation做实际的位置和隔离工作。
