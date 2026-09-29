# IsolatedMiddleware档案

源码位置：backend/packages/harness/deerflow/extensions/isolation.py

## 一、这个类是干什么的

IsolatedMiddleware是一个隔离包装器。

IsolatedMiddleware包装一个扩展贡献的中间件。包装的目的是让扩展的失败不能打断用户的运行。

扩展中间件执行在LangChain的调用链里。扩展抛出未处理的异常会中止用户的运行。包装器把观察失败降级成一条诊断。调用照常通过。

包装器的核心是tracked_handler机制。包装器跟踪下游handler的状态。handler被调过没有。成功了没有。结果是啥。错误是啥。这些状态决定隔离恢复的行为。

隔离恢复的行为是这样的。handler之前的扩展失败，调用handler一次。handler之后的扩展失败，返回已捕获的handler结果。handler自身的失败归Agent的错误策略管。隔离恢复永远不会多加一次模型请求或工具副作用。

包装器必须镜像内部中间件的完整接口。LangChain通过类级身份检查发现能力。包装器只镜像内部中间件真正实现的hook。缓存子类机制保证接口一致。实例化IsolatedMiddleware时返回一个缓存的子类。子类只定义内部中间件实现的那些hook。

GraphBubbleUp（LangGraph的控制流异常）被特殊处理。包装器不吞掉真正的控制流。

## 二、类的成员

（一）构造

- __new__：选择缓存的子类。子类按内部中间件实现的hook集合生成。
- __init__：保存inner、source、on_error。镜像tools、state_schema、transformers属性。

（二）属性

- name：稳定的图和追踪标识。名字经过graph_safe_middleware_name规范化。
- inner：被包装的中间件。排序检查和测试用。
- source：扩展来源。来源追溯用。

（三）核心方法

- _invoke_sync：同步wrap hook的隔离调用。tracked_handler机制在这里。
- _invoke_async：异步wrap hook的隔离调用。
- _invoke_lifecycle_sync：生命周期hook的同步隔离。生命周期hook没有handler可以兜底。失败降级为不更新状态。
- _invoke_lifecycle_async：生命周期hook的异步隔离。
- _report：报告失败。发诊断。报告永远不再抛。

## 三、它和谁协作

（一）被包装者

扩展贡献的中间件是inner。LangChain的能力发现看包装器的类级身份。

（二）上层

stack.py的注入流程创建IsolatedMiddleware。ordering.py的排序检查通过inner属性看到真正的中间件。

（三）诊断

IsolatedMiddleware用loader.py的Diagnostic报告失败。on_error回调注入诊断接收器。

## 四、重要性评级

评级：9分。

理由：IsolatedMiddleware是扩展系统的安全屏障。没有它，任何一个扩展中间件的异常都会中止用户的运行。它的tracked_handler机制精细地区分了handler前、handler后、handler自身三种失败。缓存子类机制解决了LangChain类级能力发现的匹配问题。这是扩展系统的核心类。给9分。
