# deerflow.config.agent_storage_config-档案

## 一、这个模块是干什么的

这个模块管理代理定义存储后端的配置。

代理定义指`config.yaml`加`SOUL.md`这两样东西。

自定义代理和托管子代理的定义都要存下来。

这个配置决定定义存到哪种后端。

两种后端可选。

`file`是文件后端。

每个用户的自定义代理在`{base_dir}/users/{user_id}/agents/{name}/`下。

每个托管子代理是一个JSON文件。

单节点部署，没有共享挂载时是节点本地的。

`db`是数据库后端。

定义存进现有SQL持久层的`agents`和`managed_subagents`表。

每个节点都能看到同样的目录。

多实例部署必须用这个。

这个配置和`DatabaseConfig`是正交的。

`DatabaseConfig`管运行、线程、事件的持久化层。

这个配置只管代理定义。

代理的记忆（`memory.json`）是另一个关注点，由deermem存储层处理，不受这个开关影响。

## 二、模块里的主要成员

### 1、AgentStorageConfig类

只有一个字段。

`backend`选存储后端，默认`file`。

默认保持文件布局，零配置的开发不受影响。

选`db`时要求`database.backend`是sqlite或postgres。

这个要求在启动时校验。

## 三、它和谁协作

`app_config.py`的`agent_storage`字段是这份配置。

这个字段是启动专用的。

`langgraph_runtime()`在启动时校验`agent_storage.backend`和`database.backend`的匹配。

`agents_config.py`的加载函数按这个开关分派到实际存储。

`persistence/agents.py`的`get_agent_store()`是分派目标。

## 四、重要性评级

评级：5分。

理由：多实例部署的代理定义共享依赖这个开关。配置面只有一个字段。启动时的跨配置校验（backend与database.backend匹配）是这里的关键点。
