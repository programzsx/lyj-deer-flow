# deerflow.extensions包档案

## 一、这个模块是干什么的

deerflow.extensions包是扩展机制的宿主侧包门面。

源文件是backend/packages/harness/deerflow/extensions/__init__.py。

它的角色特殊。

它既是门面又是实现体。

docstring说明了这个分工。

公共契约在独立的deerflow-extension-api包里。

这个模块实现装载、注册、中间件注入和钩子点。

它不只是转发导入。

它自己定义了模块级状态。

它定义了EXTENSION_SNAPSHOT_CONTEXT_KEY常量。

它定义了_loaded全局变量。

它定义了_agent_build_extensions上下文变量。

它定义了多个函数。

它是立即导入与自定义逻辑的混合体。

它没有懒加载它的导入部分。

## 二、模块里的主要成员

它从loader模块导入Diagnostic、ExtensionLoadError、ExtensionSpec、load_extensions。

它从registry模块导入EMPTY_EXTENSIONS、ExtensionRegistry、LoadedExtensions。

它定义EXTENSION_SNAPSHOT_CONTEXT_KEY常量。

常量值是__deerflow_extension_snapshot。

双下划线前缀标记它是宿主内部键。

网关会剥离调用方提供的__键。

这个快照永远不是公共扩展契约的一部分。

它定义_loaded进程级已装载扩展。

它定义_agent_build_extensions上下文变量。

它提供get_loaded_extensions函数。

函数返回进程级已装载扩展。

它提供get_agent_build_extensions函数。

函数在图构建期间返回运行绑定的快照。

它提供bind_agent_build_extensions上下文管理器。

管理器把一份不可变快照绑定到同步图组装。

它还有 __all__ 或类似导出声明。

docstring注释解释了运行时上下文键存在的理由。

理由是图构建绑定是同步构造期的ContextVar。

到工具委派工作时绑定早已消失。

运行时上下文是运行把快照带到后续代码的通道。

## 三、它和谁协作

它向内依赖loader和registry两个模块。

它向外被代理组装逻辑消费。

组装逻辑在构建图时读取已装载扩展。

它与deerflow-extension-api包协作。

那个包定义契约。

这个包实现装载。

它与deerflow.agents.middlewares协作。

扩展通过中间件注入进入代理图。

它与网关协作。

网关剥离__键保护快照不被伪造。

## 四、重要性评级

评级是8分。

理由如下。

它是扩展机制宿主侧的实现核心。

装载、注册、注入、钩子点全在这里。

它与契约包共同构成扩展生态的两半。

契约在那边。

实现在这边。

它定义的运行时上下文键是扩展快照跨阶段传递的关键。

扣分点在于它混合了门面与实现。

混合体比纯门面难维护。

混合的理由是钩子点必须就近实现。
