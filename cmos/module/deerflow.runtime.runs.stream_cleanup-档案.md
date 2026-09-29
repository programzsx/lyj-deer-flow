# deerflow.runtime.runs.stream_cleanup

## 一、这个模块是干什么的

这个模块负责安全地关闭代理流。

问题背景是这样的。

一次运行结束时，流需要做清理。

清理包括释放provider、graph和tool资源。

这些清理必须跑完，运行才能释放自己的资源。

但如果调用方此时被取消了怎么办。

如果把取消直接传播进去，清理就跑不完。

资源就会泄漏。

这个模块的解法是延迟取消。

清理期间，宿主的取消请求被先记账。

清理完成之后，取消再继续传播。

还有一种特殊情况。

是清理动作自己抛出了取消。

这种情况会被包装成AgentStreamCloseCancelledError。

包装之后它对调用方保持可见。

## 二、模块里的主要成员

- AgentStreamCloseCancelledError：清理动作自己取消时抛出的错误。它是RuntimeError的子类。
- close_agent_stream(stream)：核心函数。按顺序做这几件事。
- 第一步，找到流的aclose方法。没有就直接返回。
- 第二步，记录当前任务的取消计数。作为后续比对的基线。
- 第三步，先调用aclose拿到结果。
- 第四步，用一次sleep(0)投递清理之前就已挂起的取消。计数差为零说明取消来自宿主。
- 第五步，把清理结果包成task，用shield反复等待。等待期间的新宿主取消会被消费掉。取消计数会被重新平衡。
- 第六步，收尾。已有异常时优先抛原异常。有延迟取消时抛延迟取消。有清理失败时抛清理失败。
- _stream_close_cancelled：把asyncio.CancelledError包装成AgentStreamCloseCancelledError。原始异常挂在__cause__上。

## 三、它和谁协作

- 它被runtime/runs/worker.py调用。worker在流循环结束后用它关闭代理流。
- 它是StreamBridge心跳约定的一部分。runtime的AGENTS.md明确要求close_agent_stream把关闭保护到完成。

## 四、重要性评级

评级是6分。

理由是它解决的是真实的资源泄漏问题。

流清理没有完成就会泄漏provider和graph引用。

延迟取消的计数平衡逻辑非常精细，是难写对的部分。

但它是一个单一职责的工具函数，影响面局限于运行收尾路径。
