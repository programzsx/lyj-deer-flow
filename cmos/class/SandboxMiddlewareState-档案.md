# SandboxMiddlewareState档案

源码位置：backend/packages/harness/deerflow/sandbox/middleware.py

## 一、这个类是干什么的

SandboxMiddlewareState是SandboxMiddleware的图状态schema。

SandboxMiddlewareState继承自AgentState。SandboxMiddlewareState声明自己的状态字段。这些字段和ThreadState schema兼容。

SandboxMiddleware的state_schema指向它。LangGraph按它理解沙箱中间件的状态。

## 二、类的成员

（一）字段

- sandbox：沙箱状态字段。SandboxStateField类型。装着sandbox_id等。
- thread_data：线程数据状态。NotRequired。ThreadDataState或None。

## 三、它和谁协作

（一）使用者

SandboxMiddleware的before_agent、after_agent、wrap_tool_call都用这个状态。读取sandbox_id。写入新的sandbox_id。

（二）兼容对象

deerflow/agents/thread_state.py的ThreadState有相同的字段。两个schema兼容。

## 四、重要性评级

评级：2分。

理由：SandboxMiddlewareState只是两个字段的状态schema声明。它是沙箱状态在图里的类型定义。但它是纯声明。给2分。
