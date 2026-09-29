# ExtensionRegistry档案

源码位置：backend/packages/harness/deerflow/extensions/registry.py

## 一、这个类是干什么的

ExtensionRegistry是扩展注册表。

ExtensionRegistry是注册阶段的可变容器。扩展通过它的公开方法注册贡献。贡献有八类。中间件贡献者。任务生命周期贡献者。系统模型调用观察者。Agent组装观察者。上下文压缩观察者。Gateway服务。HTTP路由器。实验性全栈插件。

ExtensionRegistry还负责三件事。

第一。来源归属。attributed_to上下文管理器把注册块里的一切归属到一个来源字符串。来源用于诊断、回滚和排序报错。

第二。校验。plugin方法校验插件贡献。工具名、动作名、异步handler、schema、浏览器代码大小、命名空间唯一性都查。

第三。回滚。安装失败时撤销半注册的扩展。半注册的扩展比缺失的更危险。半注册扩展产生的数据看起来是完整的。回滚有两种。discard按来源删。mark加rollback_to按位置删。

ExtensionRegistry注册完成后用build方法产出LoadedExtensions。LoadedExtensions是运行期消费的不可变快照。

## 二、类的成员

（一）注册方法

- middlewares：注册一个中间件贡献者。
- task_lifecycle：注册一个任务生命周期贡献者。
- system_model_observer：注册一个系统模型调用观察者。
- agent_assembly_observer：注册一个Agent组装观察者。
- context_compaction_observer：注册一个上下文压缩观察者。
- service：注册一个Gateway服务。有模型调用授权时包一层ModelInvocationService。
- routers：注册HTTP路由器。
- plugin：注册一个全栈插件。校验最严格。

（二）归属方法

- attributed_to：上下文管理器。把块内注册归属到一个来源。

（三）回滚方法

- mark：快照各桶长度。
- rollback_to：按位置撤销mark之后的注册。
- discard：按来源删除所有注册。

（四）产出方法

- build：构建LoadedExtensions不可变快照。

## 三、它和谁协作

（一）扩展

扩展的install(registry, config)函数拿到registry。扩展调用registry的注册方法。

（二）加载器

loader.py的load_extensions创建registry。加载失败时用mark加rollback_to回滚。

（三）运行期

LoadedExtensions被Agent构建、Gateway启动、任务生命周期通知消费。

## 四、重要性评级

评级：9分。

理由：ExtensionRegistry是扩展系统的注册枢纽。八类贡献都从这里进入宿主。来源归属让每个错误都能指名扩展。位置回滚解决了同use不同配置的真实冲突。校验挡住了坏插件。扩展系统没有它就没有注册能力。给9分。
