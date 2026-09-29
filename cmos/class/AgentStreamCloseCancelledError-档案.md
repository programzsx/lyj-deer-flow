# AgentStreamCloseCancelledError档案

源码位置：backend/packages/harness/deerflow/runtime/runs/stream_cleanup.py

## 一、这个类是干什么的

AgentStreamCloseCancelledError是一个异常类。

AgentStreamCloseCancelledError表示agent流取消了自己的异步收尾。

背景是这样的。close_agent_stream函数负责关闭agent流。流的收尾持有provider、graph、tool的清理。这些清理必须在调用方释放运行级资源之前完成。所以宿主的取消被推迟。直到close任务排空。

如果取消来自close awaitable自己。这个取消对调用方仍然可见。这种取消被包装成这个异常。这样调用方能区分两种取消。一种是宿主取消被推迟了。一种是close操作自己被取消了。

_stream_close_cancelled函数构建这个异常。把原始的asyncio.CancelledError挂到__cause__上。保留完整的取消链。

## 二、类的成员

（一）继承关系

AgentStreamCloseCancelledError继承RuntimeError。

（二）字段

AgentStreamCloseCancelledError没有自定义字段。异常消息是固定的。表示agent流取消了自己的close操作。

（三）方法

AgentStreamCloseCancelledError没有自定义方法。

## 三、它和谁协作

（一）_stream_close_cancelled

stream_cleanup.py的_stream_close_cancelled函数构建这个异常。把原始CancelledError挂为cause。

（二）close_agent_stream

close_agent_stream函数在多个分支抛出这个异常。close调用自己被取消时抛。shielded等待中close任务被取消时抛。close_task结果是被取消时抛。这些取消都来自close操作自己。不是宿主取消。

（三）worker层

worker.py的终态清理路径调用close_agent_stream。调用方把这个异常和其他异常一起处理。

## 四、重要性评级

评级：2分。

理由：AgentStreamCloseCancelledError是一个精确的错误信号。它区分了宿主取消和close自身取消。这是取消语义正确性的一部分。但它是空异常类。没有字段没有逻辑。触发场景也很窄。所以给2分。
