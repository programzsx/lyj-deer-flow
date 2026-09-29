# deerflow.tracing.metadata

## 一、这个模块是干什么的

这个模块构建Langfuse的追踪属性元数据。

背景是这样的。

Langfuse版本4的LangChain回调会把一组保留键从运行配置的metadata里提升到根追踪。

这些保留键有四个。

langfuse_session_id用来分组追踪。

LangGraph的线程映射到Langfuse的会话。

langfuse_user_id用来标记追踪的用户。

它给Users页面提供数据。

langfuse_trace_name是人类可读的追踪名。

langfuse_tags是追踪标签。

这个模块的存在目的。

是让Gateway和运行worker能注入正确的元数据。

同时不把Langfuse的内部实现泄漏到调用点。

这个模块还有一个关键规则。

Langfuse没启用时返回空字典。

调用方可以无条件合并结果。

合并空字典不影响LangSmith或其他追踪器。

## 二、模块里的主要成员

- build_langfuse_trace_metadata(...)：核心函数。返回Langfuse追踪属性的元数据字典。
- 参数包括thread_id、user_id、assistant_id、model_name、environment、deerflow_trace_id。
- thread_id映射到langfuse_session_id。
- user_id为None时回退到默认用户。这保证无认证模式下Users页面仍可用。
- model_name映射到langfuse_tags里的model:前缀标签。
- environment映射到langfuse_tags里的env:前缀标签。
- deerflow_trace_id总是输出。它把Langfuse追踪和日志行、X-Trace-Id头关联起来。
- inject_langfuse_metadata(...)：把元数据合并进运行配置。给调用方一个入口。

## 三、它和谁协作

- 它依赖config的追踪提供者查询。
- 它依赖trace_context解析请求追踪id。
- 它被runtime/runs/worker.py调用。worker把元数据写进运行配置。
- 它被client.py调用。

## 四、重要性评级

评级是4分。

理由是它是Langfuse集成的元数据桥梁。

session、user、trace id的映射是可观测性的关键。

deerflow_trace_id的关联让日志和追踪能互相对上。

但它只影响追踪展示，不影响执行。

它是纯增强功能。
