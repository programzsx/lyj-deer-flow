# MemoryCallbacks-档案

## 一、这个类是干什么的

MemoryCallbacks是agents/memory/manager.py里的类。

它是memory后端的可观测性hooks。

默认实现是no-op。覆盖你需要的。

pre-LLM-call hook on_memory_llm_call在LLM调用之前改变invoke_config。

tracer例如langfuse在LLM边界发出span。

这个文档覆盖MemoryCallbacks加LangfuseMemoryCallbacks。

位于backend/packages/harness/deerflow/agents/memory/manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、on_memory_llm_call方法

pre-LLM-call。在后端invoke模型之前改变invoke_config。

例如合并trace metadata。

参数是invoke_config、thread_id、user_id、trace_id、model_name。

默认no-op。

### 2、on_memory_llm_result方法

post-LLM-call hook。给host拥有的观测用。

对provider成功和失败都调用。

后端调用者隔离实现抛出的异常。

参数是invoke_config、prompt、response、error、duration_ms、model_name。

默认no-op。

### 3、vendorable独立性的原因

这个callback让可vendor的DeerMem后端独立于DeerFlow的extension API。

langfuse绑定住在host代码里。可移植的后端包永不命名langfuse。

### 4、LangfuseMemoryCallbacks

它是host默认callbacks。

在memory-LLM边界发出langfuse span。

on_memory_llm_call合并langfuse trace metadata到invoke_config。

和之前的_host_default_tracing_callback相同。同样的签名、时机、改变。

重新打包为callbacks方法。

langfuse不是启用的tracing provider时是no-op。

assistant_id是memory_agent。

environment从DEER_FLOW_ENV或ENVIRONMENT环境变量读取。

### 5、on_memory_llm_result的转发

extensions没有system model observers时直接返回。

用捕获的快照转发DeerMem provider结果。

## 三、它和谁协作

- MemoryManager的callbacks字段持有它。
- DeerMem在LLM调用前后调用hooks。
- LangfuseMemoryCallbacks转发到tracing和extension observers。
- host hooks作为from_config kwargs注入。

## 四、重要性评级

评级是5分。

理由如下。

这个类是memory后端的可观测性边界。

pre和post LLM-call hooks。

langfuse绑定住在host代码。可移植后端不命名langfuse。

post hook对成功和失败都调用。异常被后端隔离。

这些是memory LLM可观测性的关键。

扣掉5分。

扣分原因是它是hooks接口。默认no-op。
