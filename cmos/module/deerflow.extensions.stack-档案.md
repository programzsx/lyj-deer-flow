# deerflow.extensions.stack档案

## 一、这个模块是干什么的

这个模块是中间件栈的锚点表和唯一组合入口。

DeerFlow的中间件栈的形状编码在这里。两个结构事实驱动这个形状。

第一个事实。栈在两个嵌套的点构建。`build_lead_runtime_middlewares()`产出基础栈。然后`build_middlewares()`追加大约18个lead专属的中间件。这些全部在基础栈的内侧。扩展注入必须发生在最终列表组装完成之后。绝不能在基础构建器里。

第二个事实。列表第一项是最外层包装。这是LangChain的组合规则。

这个模块定义了五个语义位置的锚点。还定义了唯一的组合入口函数。

## 二、模块里的主要成员

### 1、_anchors函数

构建锚点表。五个语义位置各有自己的回退链。

- `MODEL_LOGICAL`，模型调用的逻辑层。锚在LLM重试循环的外面。一个逻辑决策在重试之下仍然是一个事件。
- `MODEL_PHYSICAL`，模型调用的物理层。锚在所有lead请求变换的最内侧。有一条四层回退链。这里故意不是innermost()。因为ClarificationMiddleware今天在这个点的内侧。把锚点移过它会改变"最终请求"的含义。
- `TOOL_VISIBLE`，工具调用可见层。锚在栈的最外层。
- `TOOL_RAW`，工具调用裸层。锚在ClarificationMiddleware外面。这是离工具callable最近的位置。这里故意不是inner_of(ToolErrorHandlingMiddleware)。因为SkillToolPolicy和Clarification也wrap工具调用。锚在那里会让"raw"名不副实。ClarificationMiddleware是唯一的例外。它必须保持最后。但它只拦截ask_clarification。不变换任何实际执行的工具的结果。所以TOOL_RAW看到的还是裸结果。
- `STANDARD`，标准位置。回退到LLM重试循环外面或栈最内层。

### 2、PLACEMENT_ANCHORS和_AnchorTable类

`PLACEMENT_ANCHORS`是一个惰性解析的锚点表。

`_AnchorTable`是dict的子类。第一次访问时才加载真实的锚点。这样做让导入这个模块保持低成本。也避免中间件导入环。

`snapshot()`方法返回一个填充好的普通dict拷贝。因为CPython的`dict(subclass)`快速路径可以不调用惰性的`__iter__`和`__len__`。需要拷贝的调用方必须显式强制解析。

### 3、_placement_anchors_for_scope函数

按代理作用域调整锚点。

子代理作用域有自己的MODEL_PHYSICAL锚点。锚在SystemMessageCoalescingMiddleware内侧。lead作用域用标准表。

### 4、compose_with_extensions函数

这是唯一的组合入口。合并扩展贡献进完全组装的栈并验证。

流程如下。

- 没有中间件贡献时。只验证排序。返回原栈。
- 有贡献但没传构建上下文时。抛异常。
- 调用`inject_middlewares`合并。诊断送进Gateway的运行时诊断列表。
- 调用`assert_ordering`验证最终栈。

这个函数必须调用一次。在外层构建器的最后调用。在基础构建器里调用会让MODEL_PHYSICAL的贡献插到后来追加的18个lead中间件之上。

### 5、middleware_implements函数

判断一个中间件是否真正覆盖了某个钩子。位置保证是按钩子链说的。不是按列表下标说的。一个中间件的位置只在它参与的链上有意义。这个函数让保证测试能区分"参与"和"仅存在"。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.anchors`的锚点构造函数。依赖`deerflow.extensions.injection.inject_middlewares`。依赖`deerflow.extensions.ordering.assert_ordering`。依赖`deerflow.extensions.registry.LoadedExtensions`。

这个模块被中间件构建器调用。lead代理的构建器在最后调用compose_with_extensions。

这个模块延迟导入`deerflow.agents.middlewares`里的中间件类型。延迟是依赖方向的要求。

## 四、重要性评级

评级是8分。

理由。这个模块是扩展中间件注入的唯一组合入口。栈形状的知识编码在这里。五个语义位置的保证由它的锚点表承载。

锚点表的设计是这个模块最关键的部分。MODEL_PHYSICAL和TOOL_RAW的锚点都经过仔细推敲。不是简单取最内层。每个锚点的注释记录了为什么不能简单取某个位置。锚点错了。插件观察到的语义就错了。而且没有错误信号。

惰性解析的设计解决了导入成本和依赖环的问题。

调用时机的约束也关键。在基础构建器里调用会错位。在外层构建器最后调用才正确。

扣两分的原因。没有中间件贡献时这个模块只做一次排序验证。它是扩展功能的组合点。不是全部中间件的核心。
