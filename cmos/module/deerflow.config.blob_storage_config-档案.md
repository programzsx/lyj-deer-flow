# deerflow.config.blob_storage_config-档案

## 一、这个模块是干什么的

这个模块管理内容寻址的blob存储配置。

blob存储用来存大块内容。

工具输出外部化时就用它持久化完整结果。

这个模块只保留宿主机共享的字段。

后端私有的字段放在`backend_config`字典里。

这个模块和`memory_config.py`是同一种模式的两个实例。

保持共享schema精简，后端才能互换。

## 二、模块里的主要成员

### 1、BlobStorageConfig类

`enabled`是开关，默认关闭。

默认关闭的原因是还没有生产者迁移过来。

不设置这个键的部署行为和从前完全一样。

`backend`是后端选择器。

可以是注册的后端名，比如`local_fs`。

也可以是`BlobStore`子类的点分导入路径。

工厂在取用时报错，报错是快速失败的。

原因是blob是持久状态，解析失败不能静默换成另一个存储。

`backend_config`是传给后端的私有配置字典。

local_fs读`root`，root为空时默认`{runtime_home}/blobs`。

### 2、热重载单例

`get_blob_storage_config()`返回配置单例。

这个函数会顺带触发`get_app_config()`的签名检查重载。

原因是blob配置文档上写的是热重载的。

一个决定是否外部化工具结果的中间件不经过主配置重载，就会看到过期的开关。

主配置文件临时坏掉时，保留最后一次良好的单例，让进行中的回合正常完成。

如果`get_app_config()`从来没被调用过，直接返回内存单例。

这样避免第一次访问就触发读配置文件，破坏单元测试的预期。

### 3、加载函数

`load_blob_storage_config_from_dict()`从字典加载。

顶层的未知键会被警告并忽略。

原因是blob存储是新契约，没有需要迁移的旧字段。

`set_blob_storage_config()`服务于测试和程序化设置。

## 三、它和谁协作

`app_config.py`在重载时通过`_apply_singleton_configs`调用这里的加载函数。

工具输出外部化的存储工厂消费这份配置。

`memory_config.py`是同模式的姊妹模块。

## 四、重要性评级

评级：6分。

理由：blob存储目前默认关闭，是基础设施的预留能力。热重载兜底的逻辑有价值，但整体是支撑性角色。
