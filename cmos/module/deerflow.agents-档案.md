# deerflow.agents包档案

## 一、这个模块是干什么的

deerflow.agents包是代理构建层的包门面。

源文件是backend/packages/harness/deerflow/agents/__init__.py。

它的核心设计是混合门面。

一部分成员立即导入。

一部分成员懒加载。

立即导入的是RuntimeFeatures、Next、Prev三个轻量成员。

懒加载的是重成员。

懒加载的动机写在make_lead_agent的docstring里。

动机是保持包根导入的轻量。

LangGraph Server从模块的__dict__里解析图工厂。

所以这个入口必须是一个具体的模块级函数。

不能只通过__getattr__提供。

## 二、模块里的主要成员

它提供make_lead_agent函数。

这个函数是立即定义的模块级函数。

函数体内部才执行from .lead_agent import。

函数先调用prime_enabled_skills_cache预热技能缓存。

然后委托lead_agent子包的工厂构建主图。

它用TYPE_CHECKING保护RunnableConfig的导入。

RunnableConfig只在类型检查时导入。

运行时不导入。

它用__getattr__懒加载四个名字。

名字是create_deerflow_agent、DeltaThreadState、SandboxState、ThreadState。

create_deerflow_agent来自factory模块。

三个状态类来自thread_state模块。

懒加载结果会缓存进globals。

第二次访问不再触发__getattr__。

全部八个名字在__all__里。

## 三、它和谁协作

它向内依赖features、factory、lead_agent、thread_state四个模块。

它向外被LangGraph Server和测试消费。

LangGraph Server把make_lead_agent当图工厂调用。

它下面挂着lead_agent、memory、middlewares、task_continuity四个子包。

lead_agent子包实现主图构建。

middlewares子包提供全部中间件。

memory子包提供可插拔记忆。

task_continuity子包提供父任务连续性。

## 四、重要性评级

评级是8分。

理由如下。

它是整个代理执行层的正式入口。

make_lead_agent是LangGraph Server加载主图的唯一工厂入口。

这个函数的签名和位置不能随意改动。

它的懒加载设计直接决定包根导入的重量。

__getattr__缓存进globals的写法是本仓库懒加载的标准实现。

扣分点在于它的逻辑比典型门面多。

逻辑多意味着维护责任大。
