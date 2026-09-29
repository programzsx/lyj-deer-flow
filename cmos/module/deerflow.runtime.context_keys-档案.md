# deerflow.runtime.context_keys 档案

## 一、这个模块是干什么的

这个模块定义runtime组件共享的私有上下文键。

它只有33行。但它承载的键都有安全含义。

第一个键是"当前运行预先存在的消息id"。用于运行开始前标记已有消息。

第二个键是checkpoint元数据里的agent绑定。它把物化状态和产生这条状态的agent策略绑在一起。

第三个键是项目上下文。服务端在准入时解析一次的固定项目快照。客户端永远不能提供这个值。

这个模块的核心设计思想是一句话。

内存写入必须fail closed。

缺了绑定。绑定坏了。都不能被误认成默认agent。都不能意外授权一次持久的内存写入。

## 二、模块里的主要成员

- `CURRENT_RUN_PRE_EXISTING_MESSAGE_IDS_KEY`。常量。值为`__deerflow_pre_run_message_ids`。标记运行前已存在的消息。

- `CHECKPOINT_AGENT_NAME_METADATA_KEY`。常量。值为`deerflow_agent_name`。服务端写在checkpoint元数据里的agent绑定。

- `DEFAULT_AGENT_NAME_METADATA_VALUE`。常量。值为`__default__`。哨兵值。故意不是一个合法的自定义agent名。这样缺失或非法的旧值不会被误认为默认agent。

- `PROJECT_CONTEXT_KEY`。常量。值为`__deerflow_project_context`。持有`{project_id, name, instructions, shelf, shelf_hash}`。客户端不能提供。网关准入时从两个run-config区域弹出。运行worker的运行时上下文合并也会拒绝它。

- `checkpoint_agent_binding_metadata(metadata)`。函数。复制checkpoint的服务端agent绑定。用于状态重写。调用者必须传持久化的checkpoint元数据。不能传请求元数据。缺失或畸形值保持未绑定状态。内存写入因此fail closed。

## 三、它和谁协作

它被`context_compaction.py`依赖。压缩时读取绑定键。

它被`runtime/runs/worker.py`依赖。回滚和恢复的状态重写只复制选定checkpoint的服务端绑定。

它被网关的准入逻辑依赖。项目上下文键在那里被剥离。

## 四、重要性评级

评级是6分。

理由如下。

代码量极小。但它是绑定安全契约的唯一定义点。

`DEFAULT_AGENT_NAME_METADATA_VALUE`这个哨兵设计很关键。故意用一个不合法的agent名做默认值。这个设计防止了旧数据意外授权内存写入。

键名定义分散就会漂移。集中在一个模块让"哪些键是服务端拥有的"这个问题有一个答案。

扣分原因。它只是常量和一个小工具函数。逻辑深度有限。
