# deerflow.runtime.context_compaction 档案

## 一、这个模块是干什么的

这个模块实现"手动压缩线程上下文"。

场景是这样的。

用户发`POST /api/threads/{id}/compact`。或者前端点了压缩按钮。

系统要把一条线程里的旧消息总结掉。用一条总结换掉N条旧消息。

然后写一个压缩后的新checkpoint。

这个模块就是把这件事编排起来的地方。

它复用自动总结用的同一个`DeerFlowSummarizationMiddleware`。

它通过`CheckpointStateAccessor`读状态。通过状态变更图写新checkpoint。

它还处理一个安全细节。

checkpoint元数据里记录了"这条状态是哪个agent产生的"。压缩时用这个服务端记录的绑定。不用请求里传来的agent_name。这样内存写入的授权不会被骗。

## 二、模块里的主要成员

- `ContextCompactionDisabled`。总结功能被关闭时抛出的错误。

- `ContextCompactionFailed`。线程明明可以压缩。但总结LLM调用失败时抛出的错误。这个错误会变成HTTP 500。让前端弹错误提示。它和"消息不够没法压缩"是两回事。不能混。

- `ThreadCompactionResult`。压缩结果数据类。携带线程id、是否压缩、原因、删掉的消息数、保留的消息数、总结是否更新、新checkpoint id、总token数。

- `_checkpoint_agent_binding(metadata)`。解析checkpoint携带的agent绑定。没有绑定、绑定无效时返回False。此时跳过内存刷新。压缩照常进行。

- `_safe_load_agent_config(agent_name, user_id)`。加载自定义agent配置。任何失败都返回None。配置读不到不能让压缩失败。模型用默认的。内存刷新跳过。

- `_aresolve_thread_model_name()`。解析总结用什么模型。优先级是请求指定的模型。然后是agent配置的模型。最后是配置列表第一个。

- `compact_thread_context(accessor, thread_id, ...)`。主编排函数。流程是读快照。拿checkpoint id。解析agent绑定和模型。创建总结middleware。检查消息够不够。调`acompact_state`做总结。用`Overwrite`包住保留消息写入。以`manual_compaction`节点提交。返回结果。

## 三、它和谁协作

它依赖`checkpoint_state.py`的访问器和变更图。这是参考消费者。

它依赖`agents/middlewares/summarization_middleware.py`做真正的总结。

它依赖`config/app_config.py`和`config/agents_config.py`拿配置。

它依赖`context_keys.py`拿绑定元数据键。

它的调用方是Gateway的threads路由。

## 四、重要性评级

评级是6分。

理由如下。

手动压缩是用户直接触发的功能。失败会立刻被用户看到。

它在授权上有讲究。用服务端绑定而不是请求参数来决定内存写入。这个安全设计值得肯定。

它是状态变更图的最佳示范消费者。后来者学怎么正确写checkpoint。看它就够了。

扣分原因。它是一个编排层。核心机制（总结、访问器、变更图）都在别的模块。它自己没有不可替代的底层能力。
